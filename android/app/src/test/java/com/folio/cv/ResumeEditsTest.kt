package com.folio.cv

import com.folio.cv.model.SectionType
import com.folio.cv.model.Starter
import com.folio.cv.model.Starters
import com.folio.cv.model.addEntry
import com.folio.cv.model.addSection
import com.folio.cv.model.duplicate
import com.folio.cv.model.moveSection
import com.folio.cv.model.removeSection
import com.folio.cv.model.splitItems
import com.folio.cv.model.updateEntry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Test

class ResumeEditsTest {
    private val base = Starters.create(Starter.MECHANICAL, 0L)

    @Test fun moveSectionClampsAtEdges() {
        val first = base.sections.first().id
        assertEquals(base, base.moveSection(first, -1))
        assertEquals(first, base.moveSection(first, 1).sections[1].id)
    }

    @Test fun addAndEditEntry() {
        val section = base.sections.first { it.type == SectionType.EXPERIENCE }
        val (r, entry) = base.addEntry(section.id)
        val edited = r.updateEntry(section.id, entry.id) { it.copy(title = "Test Engineer") }
        assertEquals("Test Engineer", edited.sections.first { it.id == section.id }.entries.last().title)
    }

    @Test fun addAndRemoveSection() {
        val (r, s) = base.addSection(SectionType.AWARDS)
        assertEquals(base.sections.size + 1, r.sections.size)
        assertEquals(base.sections, r.removeSection(s.id).sections)
    }

    @Test fun duplicateGetsFreshIds() {
        val copy = base.duplicate(1L)
        assertNotEquals(base.id, copy.id)
        assertNotEquals(base.sections.first().id, copy.sections.first().id)
        assertEquals(base.header, copy.header)
    }

    @Test fun splitsItems() {
        assertEquals(listOf("SolidWorks", "ANSYS", "GD&T"), splitItems("SolidWorks, ANSYS;  GD&T, "))
    }
}
