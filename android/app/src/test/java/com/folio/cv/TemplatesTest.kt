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

    @Test fun sixEngineeringTemplates() {
        assertEquals(6, Templates.inCategory(TemplateCategory.ENGINEERING).size)
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

    @Test fun darkSidebarsKeepWhiteTextReadable() {
        Templates.all.filter { it.palette.onSidebar != null }.forEach { t ->
            (t.accentOptions + t.palette.accent).forEach { bg ->
                val ratio = contrast(t.palette.onSidebar!!, bg)
                assertTrue("${t.id} %08X gives %.1f:1".format(bg, ratio), ratio >= 4.5)
            }
        }
    }

    private fun contrast(a: Long, b: Long): Double {
        fun lum(c: Long): Double {
            fun ch(v: Long): Double {
                val s = v / 255.0
                return if (s <= 0.03928) s / 12.92 else Math.pow((s + 0.055) / 1.055, 2.4)
            }
            return 0.2126 * ch(c shr 16 and 0xFF) + 0.7152 * ch(c shr 8 and 0xFF) + 0.0722 * ch(c and 0xFF)
        }
        val (hi, lo) = listOf(lum(a), lum(b)).sortedDescending()
        return (hi + 0.05) / (lo + 0.05)
    }

    @Test fun unknownIdFallsBackToDefault() {
        assertEquals("cupertino", Templates.get("nope").id)
    }
}
