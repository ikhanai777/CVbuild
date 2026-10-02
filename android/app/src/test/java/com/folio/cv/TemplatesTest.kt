package com.folio.cv

import com.folio.cv.template.TemplateCategory
import com.folio.cv.template.Templates
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class TemplatesTest {
    @Test fun idsAreUnique() {
        assertEquals(Templates.all.size, Templates.all.map { it.id }.toSet().size)
    }

    @Test fun fourEngineeringTemplates() {
        assertEquals(4, Templates.inCategory(TemplateCategory.ENGINEERING).size)
    }

    @Test fun bodyTextIsNeverTooSmall() {
        Templates.all.forEach { t ->
            assertTrue("${t.id} body ${t.type.body.sizePt}", t.type.body.sizePt >= 9.4f)
            assertTrue("${t.id} meta ${t.type.meta.sizePt}", t.type.meta.sizePt >= 8f)
        }
    }

    @Test fun startersReferenceRealTemplates() {
        com.folio.cv.model.Starter.entries.forEach { s ->
            assertEquals(s.templateId, Templates.get(s.templateId).id)
        }
    }

    @Test fun unknownIdFallsBackToDefault() {
        assertEquals("cupertino", Templates.get("nope").id)
    }
}
