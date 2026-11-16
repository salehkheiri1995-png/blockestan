package ir.blockestan.game.util

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

object RequestIds {
    fun new(): String = UUID.randomUUID().toString()
}

object DateKeys {
    /**
     * Stable local calendar day key (`yyyy-MM-dd`). Uses the device's local timezone and a
     * fixed locale so the key cannot change with the app language. No server or timezone
     * service is involved; moving the clock only changes which local day is played.
     */
    fun today(nowMs: Long = System.currentTimeMillis()): String {
        val format = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        return format.format(Date(nowMs))
    }
}

object Numbers {
    private const val PERSIAN_ZERO = '\u06F0'

    /** Converts Latin digits to Persian digits and leaves every other character untouched. */
    fun fa(value: String): String = value.map { ch ->
        if (ch in '0'..'9') PERSIAN_ZERO + (ch - '0') else ch
    }.joinToString("")

    fun fa(value: Int): String = fa(value.toString())
    fun fa(value: Long): String = fa(value.toString())

    /** 123456 -> "۱۲۳٬۴۵۶" (Persian thousands separator). */
    fun grouped(value: Int): String {
        val digits = value.toString().reversed().chunked(3).joinToString("\u066C").reversed()
        return fa(digits)
    }
}

fun secondsToClock(totalSeconds: Long): String {
    val minutes = totalSeconds / 60
    val seconds = totalSeconds % 60
    return Numbers.fa("%d:%02d".format(Locale.US, minutes, seconds))
}
