package com.folio.cv.template

import com.folio.cv.model.SectionType

/**
 * A template is a complete typographic system described as data. One layout engine interprets
 * every spec, so a new template is a new entry in [Templates], not new drawing code.
 * Pure Kotlin: no Android types, so specs are unit-testable on the JVM.
 */
data class TemplateSpec(
    val id: String,
    val name: String,
    val tagline: String,
    val category: TemplateCategory,
    val atsRating: AtsRating,
    val layout: LayoutKind,
    val header: HeaderStyle,
    val heading: HeadingStyle,
    val dates: DateStyle,
    val skills: SkillStyle,
    val type: Typography,
    val palette: Palette,
    val accentOptions: List<Long>,
    /** Page margin in points before density is applied. */
    val marginPt: Float = 48f,
    /** Sidebar width as a fraction of the content width, for sidebar layouts. */
    val sidebarFraction: Float = 0.31f,
    /** Draws an engineering-drawing border with zone ticks around every page. */
    val pageFrame: Boolean = false,
    val bulletGlyph: String = "•",
    val photo: PhotoShape = PhotoShape.NONE,
    /** Show the per-entry tool tags ("SolidWorks · ANSYS") under each entry. */
    val showEntryTags: Boolean = true,
    val nameStyle: NameStyle = NameStyle.INLINE,
    val contactStyle: ContactStyle = ContactStyle.LINE,
    /** Which sections a two-column template places in the sidebar. */
    val sidebarSections: Set<SectionType> = DEFAULT_SIDEBAR,
    /** Tint the sidebar column. When false the columns are divided by [columnRule] or white space. */
    val sidebarBackground: Boolean = true,
    /** A hairline between the two columns. */
    val columnRule: Boolean = false,
    /** Lay the summary across the full width before the columns begin. */
    val summaryFullWidth: Boolean = false,
    val headerRule: HeaderRule = HeaderRule.NONE,
) {
    companion object {
        val DEFAULT_SIDEBAR = setOf(SectionType.SKILLS, SectionType.LANGUAGES, SectionType.CERTIFICATIONS)
    }
}

enum class TemplateCategory(val label: String) {
    MINIMAL("Minimal"),
    CLASSIC("Classic"),
    MODERN("Modern"),
    CREATIVE("Creative"),
    ENGINEERING("Engineering"),
}

enum class AtsRating(val label: String) { EXCELLENT("Excellent"), VERY_GOOD("Very good"), GOOD("Good") }

enum class LayoutKind { SINGLE, SIDEBAR_LEFT, SIDEBAR_RIGHT }

enum class HeaderStyle {
    /** Name, headline and a contact line, left aligned. */
    LEFT,
    /** Everything centred; contacts joined with thin separators. */
    CENTER,
    /** Name left, contacts stacked right. */
    SPLIT,
    /** Full-bleed tinted band behind the header, light text. */
    BAND,
    /** Engineering drawing title block: a ruled table of name, discipline and contacts. */
    TITLE_BLOCK,
    /** A large photo on the left with the name, headline and contacts beside it. */
    PHOTO_LEFT,
    /**
     * The sidebar runs the full page height and carries the photo at its top; the name and
     * headline open the main column.
     */
    SIDEBAR,
}

/** How the name is set. */
enum class NameStyle {
    /** One run: "Maya Chen". */
    INLINE,
    /** First name above last name. */
    STACKED,
    /** First name above last name, the last name in a light weight. */
    BOLD_LIGHT,
}

enum class ContactStyle {
    /** One line joined with separators. */
    LINE,
    /** Small drawn icons beside each item, in up to two columns. */
    ICONS,
    /** A "Contact" list with icons at the top of the sidebar (two-column templates). */
    SIDEBAR,
}

enum class HeaderRule { NONE, HAIRLINE, THICK }

enum class HeadingStyle {
    /** Small, tracked capitals in the accent colour. */
    CAPS_TRACKED,
    /** Heading with a hairline rule beneath, full column width. */
    RULE_BELOW,
    /** Centred small capitals flanked by rules. */
    CENTERED_RULE,
    /** A short accent bar before the heading. */
    ACCENT_BAR,
    /** Spec-document numbering: "1.0  EXPERIENCE". */
    NUMBERED,
    /** Larger display-serif heading, no ornament. */
    DISPLAY,
    /** Ink heading over a full-width rule. */
    UNDERLINE,
}

enum class DateStyle {
    /** Dates right-aligned on the title line. */
    RIGHT,
    /** Dates on the line under the organisation. */
    BELOW,
    /** Dates in a left gutter, timeline style. */
    GUTTER,
    /** A vertical line with a marker per entry; the date sits above the title. */
    TIMELINE,
}

enum class SkillStyle {
    /** Comma-joined line per group: "CAD / CAE  SolidWorks, Creo, NX". */
    INLINE,
    /** Outlined tags that wrap. */
    TAGS,
    /** Group label above a stacked list. */
    LIST,
    /** One bulleted item per line, in two columns when there is room. */
    BULLETS,
}

enum class PhotoShape { NONE, CIRCLE, ROUNDED }

enum class FontFamilyId(val label: String) {
    INTER("Inter"),
    PLEX_SANS("IBM Plex Sans"),
    PLEX_MONO("IBM Plex Mono"),
    GARAMOND("EB Garamond"),
    SOURCE_SERIF("Source Serif"),
    FRAUNCES("Fraunces"),
    MANROPE("Manrope"),
    DM_SANS("DM Sans"),
    SPACE_GROTESK("Space Grotesk"),
    JETBRAINS_MONO("JetBrains Mono"),
    POPPINS("Poppins"),
    LATO("Lato"),
}

enum class Weight { LIGHT, REGULAR, MEDIUM, BOLD }

data class TypeRole(
    val family: FontFamilyId,
    val weight: Weight,
    val sizePt: Float,
    val italic: Boolean = false,
    val caps: Boolean = false,
    /** Letter spacing in em. */
    val tracking: Float = 0f,
    val lineHeight: Float = 1.3f,
)

/** The six type roles. Nothing on a page is set outside these. */
data class Typography(
    val name: TypeRole,
    val headline: TypeRole,
    val section: TypeRole,
    val entryTitle: TypeRole,
    val body: TypeRole,
    val meta: TypeRole,
)

data class Palette(
    val ink: Long = 0xFF1D1D1F,
    val secondary: Long = 0xFF6E6E73,
    val rule: Long = 0xFFD2D2D7,
    val accent: Long,
    val sidebarFill: Long? = null,
    val bandFill: Long? = null,
    val onBand: Long = 0xFFFFFFFF,
    /** Text colour on a dark sidebar. Null keeps the page colours. */
    val onSidebar: Long? = null,
)
