package com.folio.cv.template

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
)

enum class TemplateCategory(val label: String) {
    MINIMAL("Minimal"),
    CLASSIC("Classic"),
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
}

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
}

enum class DateStyle {
    /** Dates right-aligned on the title line. */
    RIGHT,
    /** Dates on the line under the organisation. */
    BELOW,
    /** Dates in a left gutter, timeline style. */
    GUTTER,
}

enum class SkillStyle {
    /** Comma-joined line per group: "CAD / CAE  SolidWorks, Creo, NX". */
    INLINE,
    /** Outlined tags that wrap. */
    TAGS,
    /** Group label above a stacked list. */
    LIST,
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
}

enum class Weight { REGULAR, MEDIUM, BOLD }

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
)
