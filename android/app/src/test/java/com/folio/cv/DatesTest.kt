package com.folio.cv

import com.folio.cv.model.DateFormat
import com.folio.cv.model.Dates
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class DatesTest {
    @Test fun normalizesCommonInputs() {
        assertEquals("2024-03", Dates.normalize("03/2024"))
        assertEquals("2024-03", Dates.normalize("3/2024"))
        assertEquals("2024-03", Dates.normalize("2024-3"))
        assertEquals("2024", Dates.normalize("2024"))
        assertEquals("", Dates.normalize("  "))
        assertNull(Dates.normalize("13/2024"))
        assertNull(Dates.normalize("March"))
    }

    @Test fun formatsRangesWithEnDash() {
        assertEquals("Mar 2021 – Present", Dates.range("2021-03", "", true, DateFormat.SHORT_MONTH))
        assertEquals("03/2021 – 06/2023", Dates.range("2021-03", "2023-06", false, DateFormat.NUMERIC))
        assertEquals("2021 – 2023", Dates.range("2021-03", "2023-06", false, DateFormat.YEAR))
        assertEquals("2020", Dates.range("2020", "2020", false, DateFormat.SHORT_MONTH))
        assertEquals("", Dates.range("", "", false, DateFormat.SHORT_MONTH))
    }
}
