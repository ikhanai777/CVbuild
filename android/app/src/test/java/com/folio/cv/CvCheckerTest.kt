package com.folio.cv

import com.folio.cv.analysis.CheckLevel
import com.folio.cv.analysis.CvChecker
import com.folio.cv.model.Header
import com.folio.cv.model.Starter
import com.folio.cv.model.Starters
import com.folio.cv.template.Templates
import org.junit.Assert.assertTrue
import org.junit.Test

class CvCheckerTest {
    @Test fun mechanicalSampleScoresWell() {
        val r = Starters.create(Starter.MECHANICAL, 0L)
        val report = CvChecker.check(r, Templates.get(r.style.templateId))
        assertTrue("problems: ${report.problems}", report.problems.isEmpty())
        assertTrue(report.score >= 80)
    }

    @Test fun blankCvFlagsEssentials() {
        val r = Starters.create(Starter.BLANK, 0L)
        val report = CvChecker.check(r, Templates.get("cupertino"))
        assertTrue(report.items.any { it.level == CheckLevel.PROBLEM && it.title.contains("name", ignoreCase = true) })
        assertTrue(report.items.any { it.level == CheckLevel.PROBLEM && it.title.contains("email", ignoreCase = true) })
        assertTrue(report.score < 60)
    }

    @Test fun invalidEmailIsAProblem() {
        val r = Starters.create(Starter.PROFESSIONAL, 0L).let { it.copy(header = it.header.copy(email = "not-an-email")) }
        val report = CvChecker.check(r, Templates.get("cupertino"))
        assertTrue(report.problems.any { it.title.contains("email", ignoreCase = true) })
    }

    @Test fun credentialsAppearInDisplayName() {
        assertTrue(Header(fullName = "Daniel Okafor", credentials = "PE").displayName == "Daniel Okafor, PE")
    }
}
