package ir.blockestan.game.util

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class UtilTest {
    @Test
    fun persianDigitsCoverEveryLatinDigitAndLeaveOtherCharacters() {
        assertEquals("۰۱۲۳۴۵۶۷۸۹", Numbers.fa("0123456789"))
        assertEquals("بلوکستان ۸×۸", Numbers.fa("بلوکستان 8×8"))
        assertEquals("", Numbers.fa(""))
    }

    @Test
    fun groupedNumbersUsePersianThousandsSeparator() {
        assertEquals("۰", Numbers.grouped(0))
        assertEquals("۹۹۹", Numbers.grouped(999))
        assertEquals("۱٬۰۰۰", Numbers.grouped(1_000))
        assertEquals("۱۲۳٬۴۵۶", Numbers.grouped(123_456))
        assertEquals("۱٬۲۳۴٬۵۶۷", Numbers.grouped(1_234_567))
    }

    @Test
    fun secondsToClockPadsSecondsWithPersianDigits() {
        assertEquals("۰:۰۵", secondsToClock(5))
        assertEquals("۱:۰۰", secondsToClock(60))
        assertEquals("۱۲:۳۴", secondsToClock(754))
        assertEquals("۱۰۰:۰۰", secondsToClock(6_000))
    }

    @Test
    fun dateKeyIsStableForTheSameInstantAndMatchesLocalCalendarDay() {
        val instant = 1_765_000_000_000L
        val key = DateKeys.today(instant)
        assertEquals(key, DateKeys.today(instant))
        assertTrue(Regex("^\\d{4}-\\d{2}-\\d{2}$").matches(key))

        val expected = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(instant))
        assertEquals(expected, key)
    }

    @Test
    fun dateKeyUsesLocalCalendarDayNotUtc() {
        // 23:30 UTC is already a different local day in time zones east of UTC.
        val instant = 1_700_000_000_000L
        val expected = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(instant))
        assertEquals(expected, DateKeys.today(instant))
    }
}
