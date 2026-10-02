package com.folio.cv.model

import kotlinx.serialization.Serializable

/**
 * A CV document. Everything the user writes lives here; how it looks lives in [style],
 * which points at a template. Pure Kotlin so it can be unit-tested on the JVM.
 */
@Serializable
data class Resume(
    val id: String,
    val name: String,
    val header: Header = Header(),
    val sections: List<Section> = emptyList(),
    val style: StyleSettings = StyleSettings(),
    val createdAt: Long = 0L,
    val updatedAt: Long = 0L,
) {
    val visibleSections: List<Section> get() = sections.filter { it.visible && !it.isEmpty }
}

@Serializable
data class Header(
    val fullName: String = "",
    val headline: String = "",
    /** Post-nominal credentials, e.g. "PE, CSWP" for a licensed mechanical engineer. */
    val credentials: String = "",
    val email: String = "",
    val phone: String = "",
    val location: String = "",
    val website: String = "",
    val linkedin: String = "",
    val github: String = "",
    val photoPath: String? = null,
) {
    /** Contact items in display order, blanks removed. */
    fun contactItems(): List<ContactItem> = buildList {
        if (email.isNotBlank()) add(ContactItem(ContactKind.EMAIL, email.trim()))
        if (phone.isNotBlank()) add(ContactItem(ContactKind.PHONE, phone.trim()))
        if (location.isNotBlank()) add(ContactItem(ContactKind.LOCATION, location.trim()))
        if (website.isNotBlank()) add(ContactItem(ContactKind.WEBSITE, website.trim()))
        if (linkedin.isNotBlank()) add(ContactItem(ContactKind.LINKEDIN, linkedin.trim()))
        if (github.isNotBlank()) add(ContactItem(ContactKind.GITHUB, github.trim()))
    }

    val displayName: String
        get() = if (credentials.isBlank()) fullName.trim() else "${fullName.trim()}, ${credentials.trim()}"
}

enum class ContactKind { EMAIL, PHONE, LOCATION, WEBSITE, LINKEDIN, GITHUB }

data class ContactItem(val kind: ContactKind, val value: String)

@Serializable
enum class SectionType(val defaultTitle: String, val content: SectionContent) {
    SUMMARY("Summary", SectionContent.TEXT),
    EXPERIENCE("Experience", SectionContent.ENTRIES),
    EDUCATION("Education", SectionContent.ENTRIES),
    SKILLS("Skills", SectionContent.GROUPS),
    PROJECTS("Projects", SectionContent.ENTRIES),
    CERTIFICATIONS("Licenses & Certifications", SectionContent.ENTRIES),
    LANGUAGES("Languages", SectionContent.GROUPS),
    AWARDS("Awards", SectionContent.ENTRIES),
    PUBLICATIONS("Publications", SectionContent.ENTRIES),
    PATENTS("Patents", SectionContent.ENTRIES),
    VOLUNTEERING("Volunteering", SectionContent.ENTRIES),
    REFERENCES("References", SectionContent.ENTRIES),
    CUSTOM("Custom section", SectionContent.ENTRIES);

    /** Sections that two-column templates place in the sidebar. */
    val prefersSidebar: Boolean
        get() = this == SKILLS || this == LANGUAGES || this == CERTIFICATIONS
}

enum class SectionContent { TEXT, ENTRIES, GROUPS }

@Serializable
data class Section(
    val id: String,
    val type: SectionType,
    val title: String = type.defaultTitle,
    val visible: Boolean = true,
    val text: String = "",
    val entries: List<Entry> = emptyList(),
    val groups: List<SkillGroup> = emptyList(),
) {
    val isEmpty: Boolean
        get() = when (type.content) {
            SectionContent.TEXT -> text.isBlank()
            SectionContent.ENTRIES -> entries.none { !it.isBlank }
            SectionContent.GROUPS -> groups.none { g -> g.items.any { it.isNotBlank() } }
        }
}

@Serializable
data class Entry(
    val id: String,
    /** Role, degree, project or certificate name. */
    val title: String = "",
    /** Employer, school or issuer. */
    val organization: String = "",
    val location: String = "",
    /** "YYYY-MM" or "YYYY"; blank when unknown. */
    val start: String = "",
    val end: String = "",
    val current: Boolean = false,
    val description: String = "",
    val bullets: List<String> = emptyList(),
    /** Tools or keywords, e.g. "SolidWorks", "ANSYS". */
    val tags: List<String> = emptyList(),
    val link: String = "",
) {
    val isBlank: Boolean
        get() = title.isBlank() && organization.isBlank() && description.isBlank() &&
            bullets.all { it.isBlank() } && tags.isEmpty()
}

@Serializable
data class SkillGroup(
    val id: String,
    /** Optional group name, e.g. "CAD / CAE". Blank renders the items without a label. */
    val name: String = "",
    val items: List<String> = emptyList(),
)

@Serializable
data class StyleSettings(
    val templateId: String = "cupertino",
    /** ARGB accent; null uses the template default. */
    val accent: Long? = null,
    val density: Density = Density.BALANCED,
    val pageSize: PageSize = PageSize.A4,
    val dateFormat: DateFormat = DateFormat.SHORT_MONTH,
    val showPhoto: Boolean = true,
)

@Serializable
enum class Density(val label: String, val factor: Float) {
    COMPACT("Compact", 0.85f),
    BALANCED("Balanced", 1f),
    AIRY("Airy", 1.15f),
}

/** Page sizes in PostScript points (1/72 inch), the unit PDF uses. */
@Serializable
enum class PageSize(val label: String, val widthPt: Float, val heightPt: Float) {
    A4("A4", 595.28f, 841.89f),
    LETTER("US Letter", 612f, 792f),
}

@Serializable
enum class DateFormat(val label: String) {
    SHORT_MONTH("Jan 2024"),
    NUMERIC("01/2024"),
    YEAR("2024"),
}
