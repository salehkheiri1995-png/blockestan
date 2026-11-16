package ir.blockestan.game.core.model

import kotlinx.serialization.Serializable

const val BOARD_SIZE = 8
const val CELL_COUNT = BOARD_SIZE * BOARD_SIZE
const val NEUTRAL_BLOCK_COLOR = 6
const val MAX_PIECE_COLOR = 5

@Serializable
data class Cell(val row: Int, val col: Int) {
    val index: Int get() = row * BOARD_SIZE + col
}

fun indexOf(row: Int, col: Int): Int = row * BOARD_SIZE + col
fun rowOf(index: Int): Int = index / BOARD_SIZE
fun colOf(index: Int): Int = index % BOARD_SIZE
fun inBounds(row: Int, col: Int): Boolean =
    row in 0 until BOARD_SIZE && col in 0 until BOARD_SIZE

fun inBounds(index: Int): Boolean = index in 0 until CELL_COUNT

@Serializable
data class PieceShape(
    val name: String,
    val cells: List<Cell>
) {
    init {
        require(cells.isNotEmpty()) { "A piece must contain at least one cell" }
        require(cells.distinct().size == cells.size) { "A piece must not contain duplicate cells" }
        require(cells.all { inBounds(it.row, it.col) }) { "Piece cells must be normalized and in bounds" }
        require(cells.minOf { it.row } == 0 && cells.minOf { it.col } == 0) {
            "Piece cells must be normalized to the top-left origin"
        }
    }

    val width: Int get() = cells.maxOf { it.col } + 1
    val height: Int get() = cells.maxOf { it.row } + 1
    val size: Int get() = cells.size

    fun contains(row: Int, col: Int): Boolean = cells.any { it.row == row && it.col == col }
}

@Serializable
data class Piece(
    val shape: PieceShape,
    val color: Int
) {
    init {
        require(color in 1..MAX_PIECE_COLOR) { "Piece color must be in 1..$MAX_PIECE_COLOR" }
    }
}

fun emptyBoard(): List<Int> = List(CELL_COUNT) { 0 }

fun boardFromRows(rows: List<String>): List<Int> {
    require(rows.size == BOARD_SIZE) { "Board must have $BOARD_SIZE rows" }
    val cells = MutableList(CELL_COUNT) { 0 }
    rows.forEachIndexed { row, line ->
        require(line.length == BOARD_SIZE) { "Row $row must have $BOARD_SIZE characters" }
        line.forEachIndexed { col, ch ->
            cells[indexOf(row, col)] = when (ch) {
                '.' -> 0
                '#' -> NEUTRAL_BLOCK_COLOR
                else -> error("Unknown board character '$ch' in row $row")
            }
        }
    }
    return cells
}

fun boardToRows(board: List<Int>): List<String> =
    (0 until BOARD_SIZE).map { row ->
        (0 until BOARD_SIZE).map { col ->
            if (board[indexOf(row, col)] == 0) '.' else '#'
        }.joinToString("")
    }

fun fullRowIndices(board: List<Int>): List<Int> =
    (0 until BOARD_SIZE).filter { row -> (0 until BOARD_SIZE).all { col -> board[indexOf(row, col)] != 0 } }

fun fullColumnIndices(board: List<Int>): List<Int> =
    (0 until BOARD_SIZE).filter { col -> (0 until BOARD_SIZE).all { row -> board[indexOf(row, col)] != 0 } }

fun cellsInFullLines(board: List<Int>): Set<Int> {
    val result = LinkedHashSet<Int>()
    fullRowIndices(board).forEach { row ->
        (0 until BOARD_SIZE).forEach { col -> result += indexOf(row, col) }
    }
    fullColumnIndices(board).forEach { col ->
        (0 until BOARD_SIZE).forEach { row -> result += indexOf(row, col) }
    }
    return result
}
