package com.folio.cv

import com.folio.cv.data.Portability
import com.folio.cv.model.SectionType
import com.folio.cv.model.Starter
import com.folio.cv.model.Starters
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class PortabilityTest {
    @Test fun folioRoundTripIsLossless() {
        val original = Starters.create(Starter.MECHANICAL, 0L)
        val restored = assertNotNullAnd(Portability.import(Portability.export(original), 5L))
        assertNotEquals(original.id, restored.id)
        assertEquals(original.header, restored.header)
        assertEquals(original.sections, restored.sections)
        assertEquals(original.style, restored.style)
    }

    @Test fun importsPlainJsonResume() {
        val json = """
            {"basics":{"name":"Ada Lovelace","label":"Engineer","email":"ada@example.com",
              "location":{"city":"London","countryCode":"UK"},
              "profiles":[{"network":"LinkedIn","url":"linkedin.com/in/ada"}]},
             "work":[{"name":"Analytical Co","position":"Lead","startDate":"2020-01-15","highlights":["Built 1 engine"]}],
             "skills":[{"name":"CAD","keywords":["SolidWorks","Creo"]}],
             "languages":[{"language":"English","fluency":"Native"}]}
        """.trimIndent()
        val r = assertNotNullAnd(Portability.import(json, 0L))
        assertEquals("Ada Lovelace", r.header.fullName)
        assertEquals("London, UK", r.header.location)
        assertEquals("linkedin.com/in/ada", r.header.linkedin)
        val work = r.sections.first { it.type == SectionType.EXPERIENCE }.entries.single()
        assertEquals("2020-01", work.start)
        assertEquals(true, work.current)
        assertEquals(listOf("SolidWorks", "Creo"), r.sections.first { it.type == SectionType.SKILLS }.groups.single().items)
        assertEquals(listOf("English (Native)"), r.sections.first { it.type == SectionType.LANGUAGES }.groups.single().items)
    }

    @Test fun rejectsUnrelatedJson() {
        assertNull(Portability.import("""{"hello":"world"}""", 0L))
        assertNull(Portability.import("not json", 0L))
    }

    private fun <T> assertNotNullAnd(value: T?): T {
        assertNotNull(value)
        return value!!
    }
}
