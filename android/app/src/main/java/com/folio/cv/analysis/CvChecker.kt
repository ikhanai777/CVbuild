package com.folio.cv.analysis

import com.folio.cv.model.Resume
import com.folio.cv.model.SectionContent
import com.folio.cv.model.SectionType
import com.folio.cv.template.AtsRating
import com.folio.cv.template.TemplateSpec

enum class CheckLevel { PASS, ADVICE, PROBLEM }

data class CheckItem(val level: CheckLevel, val title: String, val detail: String)

data class CheckReport(val score: Int, val items: List<CheckItem>) {
    val problems get() = items.filter { it.level == CheckLevel.PROBLEM }
    val advice get() = items.filter { it.level == CheckLevel.ADVICE }
    val passes get() = items.filter { it.level == CheckLevel.PASS }
}

/**
 * Reviews a CV the way a recruiter and an applicant tracking system (ATS) would:
 * can a machine find the essentials, and does the writing show impact?
 */
object CvChecker {

    private val weakOpeners = listOf(
        "responsible for", "helped", "worked on", "assisted", "involved in", "duties included", "tasked with",
    )

    private val standardTitles = SectionType.entries.map { it.defaultTitle.lowercase() }.toSet() + setOf(
        "work experience", "professional experience", "employment", "technical skills", "core skills",
        "profile", "professional summary", "certifications", "licenses", "education and training", "key projects",
    )

    fun check(resume: Resume, template: TemplateSpec): CheckReport {
        val items = mutableListOf<CheckItem>()
        val h = resume.header

        fun pass(t: String, d: String) = items.add(CheckItem(CheckLevel.PASS, t, d))
        fun advise(t: String, d: String) = items.add(CheckItem(CheckLevel.ADVICE, t, d))
        fun problem(t: String, d: String) = items.add(CheckItem(CheckLevel.PROBLEM, t, d))

        // Contact essentials
        if (h.fullName.isBlank()) problem("Add your name", "Every ATS reads the name first; without it the CV can't be filed.")
        else pass("Name found", h.fullName)

        val emailOk = Regex("""^[^@\s]+@[^@\s]+\.[^@\s]+$""").matches(h.email.trim())
        when {
            h.email.isBlank() -> problem("Add an email address", "Recruiters reply by email. It's the one contact detail you can't skip.")
            !emailOk -> problem("Check your email address", "\"${h.email}\" doesn't look like a valid address.")
            else -> pass("Email is valid", h.email)
        }
        if (h.phone.isBlank()) advise("Add a phone number", "Many recruiters call before they email.") else pass("Phone number found", h.phone)
        if (h.headline.isBlank()) advise("Add a headline", "A one-line title, like \"Mechanical Design Engineer\", tells the reader who you are in a second.")

        // Summary
        val summary = resume.visibleSections.firstOrNull { it.type == SectionType.SUMMARY }
        when {
            summary == null -> advise("Add a short summary", "Two or three sentences on what you do and what you've achieved.")
            summary.text.length > 650 -> advise("Tighten your summary", "It's ${summary.text.length} characters. Aim for under 600 so it's read, not skimmed.")
            summary.text.length < 120 -> advise("Expand your summary a little", "A summary under 120 characters rarely says enough to stand out.")
            else -> pass("Summary length is right", "${summary.text.length} characters.")
        }

        // Experience and dates
        val experience = resume.visibleSections.filter { it.type == SectionType.EXPERIENCE }.flatMap { it.entries }.filterNot { it.isBlank }
        val education = resume.visibleSections.filter { it.type == SectionType.EDUCATION }.flatMap { it.entries }.filterNot { it.isBlank }
        if (experience.isEmpty() && education.isEmpty()) {
            problem("Add experience or education", "An ATS needs at least one of these to place you.")
        }
        val undated = experience.count { it.start.isBlank() && it.end.isBlank() && !it.current }
        if (undated > 0) problem("Add dates to $undated role${if (undated > 1) "s" else ""}", "Undated roles are often discarded by ATS filters.")
        else if (experience.isNotEmpty()) pass("Every role has dates", "${experience.size} role${if (experience.size > 1) "s" else ""} checked.")

        // Bullets: action verbs, numbers, length
        val bullets = resume.visibleSections.flatMap { s -> s.entries.flatMap { it.bullets } }.map { it.trim() }.filter { it.isNotEmpty() }
        if (bullets.isNotEmpty()) {
            val weak = bullets.filter { b -> weakOpeners.any { b.lowercase().startsWith(it) } }
            if (weak.isNotEmpty()) {
                advise(
                    "Start ${weak.size} bullet${if (weak.size > 1) "s" else ""} with a strong verb",
                    "Replace openers like \"Responsible for\" with what you did: Designed, Reduced, Led, Validated.",
                )
            } else pass("Bullets start with action verbs", "${bullets.size} bullets checked.")

            val quantified = bullets.count { b -> b.any { it.isDigit() } }
            val ratio = quantified.toFloat() / bullets.size
            if (ratio < 0.5f) {
                advise(
                    "Quantify more results",
                    "$quantified of ${bullets.size} bullets include a number. Engineers are judged on outcomes: mass, cost, cycle time, scrap rate.",
                )
            } else pass("Results are quantified", "$quantified of ${bullets.size} bullets include a number.")

            val long = bullets.count { it.length > 240 }
            if (long > 0) advise("Shorten $long long bullet${if (long > 1) "s" else ""}", "Keep bullets under two lines so each one lands.")
        } else if (experience.isNotEmpty()) {
            advise("Add bullet points to your roles", "Three to five bullets per recent role, each with a result.")
        }

        // Skills
        val skillCount = resume.visibleSections.filter { it.type.content == SectionContent.GROUPS && it.type == SectionType.SKILLS }
            .flatMap { it.groups }.sumOf { g -> g.items.count { it.isNotBlank() } }
        if (skillCount == 0) problem("Add a skills section", "ATS keyword matching leans heavily on an explicit skills list.")
        else if (skillCount < 6) advise("List a few more skills", "You have $skillCount. Most job ads screen for 6 to 15 specific tools or methods.")
        else pass("Skills are listed", "$skillCount skills, ready for keyword matching.")

        // Section titles
        val unusual = resume.visibleSections.filter { it.title.trim().lowercase() !in standardTitles }
        if (unusual.isNotEmpty()) {
            advise(
                "Use standard section titles",
                "ATS software may not recognise: ${unusual.joinToString { "\"${it.title}\"" }}.",
            )
        } else pass("Section titles are standard", "Every heading is one an ATS expects.")

        // Template and photo
        when (template.atsRating) {
            AtsRating.EXCELLENT -> pass("Template reads cleanly", "${template.name} is single-column readable for ATS.")
            AtsRating.VERY_GOOD -> pass("Template reads well", "${template.name} keeps a linear reading order.")
            AtsRating.GOOD -> advise("Consider a simpler template for online applications", "${template.name} is designed for people first. Use Cupertino or Chartered for ATS portals.")
        }
        if (h.photoPath != null && resume.style.showPhoto) {
            advise("Photo included", "Common in much of Europe and Asia, but US and UK recruiters usually prefer CVs without one.")
        }

        val problems = items.count { it.level == CheckLevel.PROBLEM }
        val advice = items.count { it.level == CheckLevel.ADVICE }
        val score = (100 - problems * 15 - advice * 5).coerceIn(0, 100)
        val ordered = items.sortedBy { it.level.ordinal * -1 }
        return CheckReport(score, ordered)
    }
}
