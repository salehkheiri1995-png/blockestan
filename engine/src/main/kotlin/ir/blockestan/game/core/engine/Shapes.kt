package ir.blockestan.game.core.engine

import ir.blockestan.game.core.model.Cell
import ir.blockestan.game.core.model.PieceShape

/**
 * Shapes are authored here, normalized to (0,0), without rotation in the first release.
 * Duplicate shape definitions are rejected by ShapeCatalog.
 */
object Shapes {
    private fun shape(name: String, vararg cells: Pair<Int, Int>): PieceShape =
        PieceShape(name, cells.map { Cell(it.first, it.second) })

    val SINGLE = shape("single", 0 to 0)

    val DOMINO_H = shape("domino_h", 0 to 0, 0 to 1)
    val DOMINO_V = shape("domino_v", 0 to 0, 1 to 0)

    val LINE3_H = shape("line3_h", 0 to 0, 0 to 1, 0 to 2)
    val LINE3_V = shape("line3_v", 0 to 0, 1 to 0, 2 to 0)

    val LINE4_H = shape("line4_h", 0 to 0, 0 to 1, 0 to 2, 0 to 3)
    val LINE4_V = shape("line4_v", 0 to 0, 1 to 0, 2 to 0, 3 to 0)

    val SQUARE2 = shape("square2", 0 to 0, 0 to 1, 1 to 0, 1 to 1)

    val RECT2X3 = shape("rect2x3", 0 to 0, 0 to 1, 0 to 2, 1 to 0, 1 to 1, 1 to 2)
    val RECT3X2 = shape("rect3x2", 0 to 0, 0 to 1, 1 to 0, 1 to 1, 2 to 0, 2 to 1)

    val L3_A = shape("l3_a", 0 to 0, 1 to 0, 1 to 1)
    val L3_B = shape("l3_b", 0 to 1, 1 to 0, 1 to 1)
    val L3_C = shape("l3_c", 0 to 0, 0 to 1, 1 to 0)
    val L3_D = shape("l3_d", 0 to 0, 0 to 1, 1 to 1)

    val L4_A = shape("l4_a", 0 to 0, 1 to 0, 2 to 0, 2 to 1)
    val L4_B = shape("l4_b", 0 to 1, 1 to 1, 2 to 0, 2 to 1)
    val L4_C = shape("l4_c", 0 to 0, 0 to 1, 0 to 2, 1 to 0)
    val L4_D = shape("l4_d", 0 to 0, 0 to 1, 0 to 2, 1 to 2)

    val T4_UP = shape("t4_up", 0 to 0, 0 to 1, 0 to 2, 1 to 1)
    val T4_DOWN = shape("t4_down", 0 to 1, 1 to 0, 1 to 1, 1 to 2)
    val T4_LEFT = shape("t4_left", 0 to 0, 1 to 0, 2 to 0, 1 to 1)
    val T4_RIGHT = shape("t4_right", 0 to 1, 1 to 0, 1 to 1, 2 to 1)

    val S4 = shape("s4", 0 to 1, 0 to 2, 1 to 0, 1 to 1)
    val Z4 = shape("z4", 0 to 0, 0 to 1, 1 to 1, 1 to 2)
}

object ShapeCatalog {
    val all: List<PieceShape> = listOf(
        Shapes.SINGLE,
        Shapes.DOMINO_H,
        Shapes.DOMINO_V,
        Shapes.LINE3_H,
        Shapes.LINE3_V,
        Shapes.LINE4_H,
        Shapes.LINE4_V,
        Shapes.SQUARE2,
        Shapes.RECT2X3,
        Shapes.RECT3X2,
        Shapes.L3_A,
        Shapes.L3_B,
        Shapes.L3_C,
        Shapes.L3_D,
        Shapes.L4_A,
        Shapes.L4_B,
        Shapes.L4_C,
        Shapes.L4_D,
        Shapes.T4_UP,
        Shapes.T4_DOWN,
        Shapes.T4_LEFT,
        Shapes.T4_RIGHT,
        Shapes.S4,
        Shapes.Z4
    )

    private val byName: Map<String, PieceShape> = all.associateBy { it.name }

    init {
        check(all.map { it.name }.distinct().size == all.size) { "Shape names must be unique" }
        check(all.map { canonical(it) }.distinct().size == all.size) { "Duplicate shape definitions" }
    }

    fun byName(name: String): PieceShape =
        byName[name] ?: error("Unknown shape '$name'")

    fun byNameOrNull(name: String): PieceShape? = byName[name]

    fun paletteColor(shape: PieceShape, slot: Int, trayIndex: Int = 0): Int {
        val base = all.indexOfFirst { it.name == shape.name }.coerceAtLeast(0)
        return ((base + slot + trayIndex) % 5) + 1
    }

    private fun canonical(shape: PieceShape): String =
        shape.cells.sortedWith(compareBy({ it.row }, { it.col })).joinToString(";") { "${it.row},${it.col}" }
}
