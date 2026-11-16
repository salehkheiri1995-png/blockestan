package ir.blockestan.game.tools

import ir.blockestan.game.core.engine.DeterministicRandom
import ir.blockestan.game.core.engine.Shapes
import ir.blockestan.game.core.engine.GameSession
import ir.blockestan.game.core.generation.LevelCatalog
import ir.blockestan.game.core.generation.LevelCatalogFile
import ir.blockestan.game.core.generation.LevelDefinition
import ir.blockestan.game.core.generation.LevelValidator
import ir.blockestan.game.core.generation.PieceSpec
import ir.blockestan.game.core.generation.ReferenceMove
import ir.blockestan.game.core.model.BOARD_SIZE
import ir.blockestan.game.core.model.CELL_COUNT
import ir.blockestan.game.core.model.Difficulty
import ir.blockestan.game.core.model.GoalType
import ir.blockestan.game.core.model.LevelGoal
import ir.blockestan.game.core.model.PlacementOutcome
import ir.blockestan.game.core.model.RunStatus
import ir.blockestan.game.core.model.StarThresholds
import ir.blockestan.game.core.model.indexOf
import java.io.File

/**
 * Offline authoring tool for the 60-level campaign.
 *
 * Every level is constructed from an explicit tray sequence and then replayed through the
 * production [GameSession]. The generator refuses to write the catalog unless each reference
 * solution is legal and wins on its final move.
 */
object LevelAuthor {
    private const val HORIZONTAL = "horizontal"
    private const val SQUARE_PAIR = "square_pair"

    private data class Plan(
        val rows: Int,
        val mode: String,
        val density: Double,
        val starRatio: Double
    )

    private data class Placement(
        val shape: String,
        val row: Int,
        val col: Int
    )

    private data class Draft(
        val board: List<String>,
        val placements: List<Placement>,
        val targetRow: Int,
        val wasteRow: Int?
    )

    private val titles = listOf(
        "آغاز آرام", "ردیف روشن", "دو ردیف", "نخستین قدم", "باغ بلوک‌ها",
        "خط افق", "پل چوبی", "برج آجری", "مسیر سبز", "چهار گوشه",
        "نور صبح", "دست‌چین", "کاشی‌های ساده", "پنجره باز", "پایان آسان",
        "گردنه", "سنگ‌فرش", "هماهنگی", "راهرو", "قطعات گمشده",
        "دروازه", "بازار", "کارگاه", "پازل شهری", "نبض بازی",
        "خانه‌های رنگی", "پیچ راه", "ستون‌ها", "آجرچین", "نیمه راه",
        "بافت کهنه", "چرخ‌دنده", "کبوتر", "سایه‌ها", "کوچه باغ",
        "حصار", "پله‌ها", "بازسازی", "نقشه گمشده", "دروازه شهر",
        "کوه بلوک", "آزمون آهن", "شب طولانی", "قلعه", "طوفان",
        "مسیر باریک", "سنگین", "چالش بزرگ", "برج تاریک", "آخرین سنگر",
        "دیوار آتش", "پیچیدگی", "استادکار", "قفل شکسته", "زمستان",
        "آهن و آجر", "سایه بلند", "نبرد نهایی", "افسانه", "بلوکستان"
    )

    private val goalText = mapOf(
        Difficulty.EASY to "آرام و پیوسته ردیف‌ها را کامل کن.",
        Difficulty.NORMAL to "با برنامه‌ریزی، خط‌ها را پاک کن و امتیاز هدف را بگیر.",
        Difficulty.HARD to "فضای کمی داری؛ هر قطعه را دقیق بچین."
    )

    private fun planFor(id: Int): Plan {
        val difficulty = difficultyFor(id)
        return when (difficulty) {
            Difficulty.EASY -> Plan(
                rows = 2 + (id - 1) % 2,
                mode = HORIZONTAL,
                density = 0.18,
                starRatio = 0.60
            )
            Difficulty.NORMAL -> {
                val square = (id - 16) % 5 == 4
                Plan(
                    rows = if (square) 2 else 3 + (id - 16) % 2,
                    mode = if (square) SQUARE_PAIR else HORIZONTAL,
                    density = 0.30 + ((id - 16) % 4) * 0.04,
                    starRatio = 0.65
                )
            }
            Difficulty.HARD -> {
                val square = (id - 41) % 6 == 5
                Plan(
                    rows = if (square) 4 else 4 + (id - 41) % 2,
                    mode = if (square) SQUARE_PAIR else HORIZONTAL,
                    density = 0.42 + ((id - 41) % 4) * 0.04,
                    starRatio = 0.70
                )
            }
        }
    }

    private fun difficultyFor(id: Int): Difficulty = when {
        id <= 15 -> Difficulty.EASY
        id <= 40 -> Difficulty.NORMAL
        else -> Difficulty.HARD
    }

    fun build(levelId: Int): LevelDefinition {
        val difficulty = difficultyFor(levelId)
        val plan = planFor(levelId)
        val seed = 0x5EED_0000L + levelId * 7919L
        val rng = DeterministicRandom(seed)
        val draft = draft(plan, rng)

        val referenceMoves = chunkTrays(draft.placements)
        val dry = dryReplay(levelId, seed, draft, referenceMoves, difficulty)

        val targetRow = draft.targetRow
        val targetCells = (0 until BOARD_SIZE).map { indexOf(targetRow, it) }
        val goals = listOf(
            LevelGoal(GoalType.SCORE, dry.score),
            LevelGoal(GoalType.LINES, dry.lines),
            LevelGoal(GoalType.TARGET_CELLS, targetCells.size)
        )
        val twoStars = maxOf(1, (dry.score * plan.starRatio).toInt())
        val threeStars = maxOf(twoStars, (dry.score * (plan.starRatio + 0.15)).toInt())

        val level = LevelDefinition(
            id = levelId,
            title = titles[levelId - 1],
            hint = "${goalText.getValue(difficulty)} هدف: ${fa(dry.lines)} خط، " +
                "${fa(dry.score)} امتیاز و آزادکردن ردیف ${fa(targetRow + 1)}.",
            seed = seed,
            initialBoard = draft.board,
            targetCells = targetCells,
            goals = goals,
            moveLimit = dry.moves + 3,
            trays = chunkTrays(draft.placements, colors = true),
            difficulty = difficulty,
            starThresholds = StarThresholds(twoStars, threeStars),
            referenceSolution = referenceMoves
        )
        LevelValidator.replay(level)
        return level
    }

    private fun dryReplay(
        levelId: Int,
        seed: Long,
        draft: Draft,
        moves: List<ReferenceMove>,
        difficulty: Difficulty
    ): ReplayStats {
        val huge = LevelDefinition(
            id = levelId,
            title = "draft",
            hint = "draft",
            seed = seed,
            initialBoard = draft.board,
            targetCells = emptyList(),
            goals = listOf(LevelGoal(GoalType.SCORE, Int.MAX_VALUE)),
            moveLimit = 40,
            trays = chunkTrays(draft.placements, colors = true),
            difficulty = difficulty,
            starThresholds = StarThresholds(1, 2),
            referenceSolution = moves
        )
        val session = GameSession.newLevel(huge)
        check(session.state.status == RunStatus.PLAYING) { "Level $levelId opening is dead" }
        moves.forEachIndexed { index, move ->
            check(session.currentTrayNumber == move.tray) {
                "Level $levelId dry move $index tray mismatch"
            }
            val outcome = session.place(move.slot, move.row, move.col)
            check(outcome is PlacementOutcome.Success) {
                "Level $levelId dry move $index illegal: $outcome"
            }
            check(session.state.status != RunStatus.LOST) { "Level $levelId dry run lost" }
            check(session.state.status != RunStatus.WON) { "Level $levelId dry run won too early" }
        }
        val state = session.state
        check(state.movesUsed == moves.size) { "Level $levelId used ${state.movesUsed} moves" }
        check(state.movesUsed <= 16) { "Level $levelId reference is too long: ${state.movesUsed}" }
        check(state.linesCleared >= 1) { "Level $levelId clears no lines" }
        check(state.remainingTargets.isEmpty())
        return ReplayStats(state.score, state.linesCleared, state.movesUsed)
    }

    private data class ReplayStats(val score: Int, val lines: Int, val moves: Int)

    private fun chunkTrays(
        placements: List<Placement>,
        colors: Boolean = false
    ): List<List<PieceSpec>> = placements.chunked(3).map { tray ->
        tray.mapIndexed { slot, placement ->
            PieceSpec(
                shape = placement.shape,
                color = if (colors) (slot % 5) + 1 else 0
            )
        }
    }

    private fun chunkTrays(placements: List<Placement>): List<ReferenceMove> {
        val moves = mutableListOf<ReferenceMove>()
        placements.chunked(3).forEachIndexed { trayIndex, tray ->
            tray.forEachIndexed { slot, placement ->
                moves += ReferenceMove(trayIndex, slot, placement.row, placement.col)
            }
        }
        return moves
    }

    private fun draft(plan: Plan, rng: DeterministicRandom): Draft {
        val placements = mutableListOf<Placement>()
        val usedRows = mutableListOf<Int>()
        var wasteRow: Int? = null

        if (plan.mode == HORIZONTAL) {
            val rows = pickRows(plan.rows, rng, exclude = emptySet())
            usedRows += rows
            rows.forEach { row ->
                val partition = pickPartition(rng)
                var col = 0
                partition.forEach { width ->
                    placements += Placement(shapeForWidth(width), row, col)
                    col += width
                }
                check(col == BOARD_SIZE) { "Row $row partition does not fill 8 cells" }
            }
        } else {
            val pairs = if (plan.rows <= 2) 1 else 2
            val start = rng.nextInt(BOARD_SIZE - 2 * pairs + 1)
            val pairRows = mutableListOf<Int>()
            for (pair in 0 until pairs) {
                pairRows += start + pair * 2
                pairRows += start + pair * 2 + 1
            }
            usedRows += pairRows
            wasteRow = (0 until BOARD_SIZE).firstOrNull { it !in usedRows }
                ?: error("No waste row available")
            // Fillers consume leftover tray slots so the last tray is not left dangling.
            val squares = pairs * 4
            val fillers = (3 - squares % 3) % 3
            for (col in 0 until fillers) {
                placements += Placement(Shapes.SINGLE.name, wasteRow, col)
            }
            for (pair in 0 until pairs) {
                val row = start + pair * 2
                for (block in 0 until 4) {
                    placements += Placement(Shapes.SQUARE2.name, row, block * 2)
                }
            }
        }

        val board = renderBoard(plan, usedRows, wasteRow, rng)
        val targetRow = usedRows.last()
        return Draft(board, placements, targetRow, wasteRow)
    }

    private fun pickPartition(rng: DeterministicRandom): List<Int> {
        val partitions = listOf(
            listOf(3, 3, 2),
            listOf(4, 3, 1),
            listOf(4, 2, 2)
        )
        return partitions[rng.nextInt(partitions.size)]
    }

    private fun shapeForWidth(width: Int): String = when (width) {
        1 -> Shapes.SINGLE.name
        2 -> Shapes.DOMINO_H.name
        3 -> Shapes.LINE3_H.name
        4 -> Shapes.LINE4_H.name
        else -> error("No horizontal shape of width $width")
    }

    private fun pickRows(count: Int, rng: DeterministicRandom, exclude: Set<Int>): List<Int> {
        val available = (0 until BOARD_SIZE).filter { it !in exclude }.toMutableList()
        // Fisher-Yates with the serializable PRNG, then keep the authored order.
        for (i in available.lastIndex downTo 1) {
            val j = rng.nextInt(i + 1)
            val tmp = available[i]
            available[i] = available[j]
            available[j] = tmp
        }
        return available.take(count).sorted()
    }

    /**
     * Obstacles never touch an authored row. Every obstacle row keeps at least one hole and
     * the authored rows are empty, so the opening board can never contain a completed line.
     */
    private fun renderBoard(
        plan: Plan,
        usedRows: List<Int>,
        wasteRow: Int?,
        rng: DeterministicRandom
    ): List<String> {
        val protectedRows = (usedRows + listOfNotNull(wasteRow)).toSet()
        return (0 until BOARD_SIZE).map { row ->
            if (row in protectedRows) {
                ".".repeat(BOARD_SIZE)
            } else {
                val chars = CharArray(BOARD_SIZE) { col ->
                    if (rng.nextDouble() < plan.density) '#' else '.'
                }
                if (chars.all { it == '#' }) {
                    chars[rng.nextInt(BOARD_SIZE)] = '.'
                }
                String(chars)
            }
        }
    }

    private fun fa(value: Int): String = value.toString().map { ch ->
        if (ch.isDigit()) '۰' + (ch - '0') else ch
    }.joinToString("")
}

fun main(args: Array<String>) {
    val outputPath = args.firstOrNull() ?: "src/main/resources/levels.json"
    val levels = (1..60).map { id ->
        LevelAuthor.build(id).also { level ->
            println(
                "level=${level.id} difficulty=${level.difficulty} moves=${level.referenceSolution.size} " +
                    "limit=${level.moveLimit} scoreGoal=${level.goals.first { it.type == GoalType.SCORE }.target}"
            )
        }
    }
    require(levels.map { it.id } == (1..60).toList())
    val results = LevelValidator.validateAll(levels)
    println("verified ${results.size} levels, total reference moves=${results.sumOf { it.moves }}")
    val file = LevelCatalogFile(
        formatVersion = LevelCatalog.FORMAT_VERSION,
        generatorVersion = LevelCatalog.GENERATOR_VERSION,
        levels = levels
    )
    val text = LevelCatalog.encode(file)
    // Parse the exact bytes we are about to write so a serialization bug cannot slip through.
    val reparsed = LevelCatalog.parse(text)
    require(reparsed.map { it.id } == levels.map { it.id })
    check(CELL_COUNT == 64 && BOARD_SIZE == 8)
    File(outputPath).apply { parentFile?.mkdirs() }.writeText(text, Charsets.UTF_8)
    println("wrote $outputPath (${text.length} chars)")
}
