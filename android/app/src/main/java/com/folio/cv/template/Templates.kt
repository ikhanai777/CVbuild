package com.folio.cv.template

import com.folio.cv.template.FontFamilyId.DM_SANS
import com.folio.cv.template.FontFamilyId.FRAUNCES
import com.folio.cv.template.FontFamilyId.GARAMOND
import com.folio.cv.template.FontFamilyId.INTER
import com.folio.cv.template.FontFamilyId.JETBRAINS_MONO
import com.folio.cv.template.FontFamilyId.MANROPE
import com.folio.cv.template.FontFamilyId.PLEX_MONO
import com.folio.cv.template.FontFamilyId.PLEX_SANS
import com.folio.cv.template.FontFamilyId.SOURCE_SERIF
import com.folio.cv.template.FontFamilyId.SPACE_GROTESK
import com.folio.cv.template.Weight.BOLD
import com.folio.cv.template.Weight.MEDIUM
import com.folio.cv.template.Weight.REGULAR

/** The curated set. Twelve templates, each a complete system; four are built for mechanical engineers. */
object Templates {

    /** Accent choices shared by most templates: restrained, print-safe, all at least 4.5:1 on white. */
    private val standardAccents = listOf(
        0xFF0071E3, // Cupertino blue
        0xFF1D1D1F, // Graphite
        0xFF0B6E4F, // Forest
        0xFF8E2C48, // Bordeaux
        0xFF1F4E79, // Navy
        0xFFB4501E, // Copper
    )

    private val engineeringAccents = listOf(
        0xFF1F4E79, // Blueprint
        0xFF34495E, // Steel
        0xFFB4501E, // Safety copper
        0xFF0B6E4F, // Machine green
        0xFF1D1D1F, // Graphite
        0xFF5B3E96, // Anodised violet
    )

    private fun sans(family: FontFamilyId, nameSize: Float = 26f, body: Float = 9.8f) = Typography(
        name = TypeRole(family, BOLD, nameSize, tracking = -0.02f, lineHeight = 1.1f),
        headline = TypeRole(family, REGULAR, 12.5f),
        section = TypeRole(family, BOLD, 8.6f, caps = true, tracking = 0.12f),
        entryTitle = TypeRole(family, BOLD, 10.4f),
        body = TypeRole(family, REGULAR, body, lineHeight = 1.38f),
        meta = TypeRole(family, REGULAR, 8.8f),
    )

    val all: List<TemplateSpec> = listOf(
        TemplateSpec(
            id = "cupertino",
            name = "Cupertino",
            tagline = "Calm, precise and Swiss. The default for a reason.",
            category = TemplateCategory.MINIMAL,
            atsRating = AtsRating.EXCELLENT,
            layout = LayoutKind.SINGLE,
            header = HeaderStyle.LEFT,
            heading = HeadingStyle.CAPS_TRACKED,
            dates = DateStyle.RIGHT,
            skills = SkillStyle.INLINE,
            type = sans(INTER, nameSize = 28f),
            palette = Palette(accent = 0xFF0071E3),
            accentOptions = standardAccents,
            marginPt = 52f,
        ),
        TemplateSpec(
            id = "infinite_loop",
            name = "Infinite Loop",
            tagline = "Ultra-minimal. Monochrome with a single accent.",
            category = TemplateCategory.MINIMAL,
            atsRating = AtsRating.EXCELLENT,
            layout = LayoutKind.SINGLE,
            header = HeaderStyle.SPLIT,
            heading = HeadingStyle.RULE_BELOW,
            dates = DateStyle.RIGHT,
            skills = SkillStyle.INLINE,
            type = sans(INTER, nameSize = 30f).let {
                it.copy(section = TypeRole(INTER, BOLD, 11f, tracking = -0.01f))
            },
            palette = Palette(accent = 0xFF1D1D1F),
            accentOptions = standardAccents,
            marginPt = 50f,
        ),
        TemplateSpec(
            id = "palo_alto",
            name = "Palo Alto",
            tagline = "Modern two-column with a quiet sidebar.",
            category = TemplateCategory.MINIMAL,
            atsRating = AtsRating.VERY_GOOD,
            layout = LayoutKind.SIDEBAR_LEFT,
            header = HeaderStyle.LEFT,
            heading = HeadingStyle.ACCENT_BAR,
            dates = DateStyle.BELOW,
            skills = SkillStyle.TAGS,
            type = sans(MANROPE, nameSize = 25f),
            palette = Palette(accent = 0xFF0071E3, sidebarFill = 0xFFF5F5F7),
            accentOptions = standardAccents,
            marginPt = 40f,
            photo = PhotoShape.CIRCLE,
        ),
        TemplateSpec(
            id = "ivy",
            name = "Ivy",
            tagline = "Classic serif for law, finance and academia.",
            category = TemplateCategory.CLASSIC,
            atsRating = AtsRating.EXCELLENT,
            layout = LayoutKind.SINGLE,
            header = HeaderStyle.CENTER,
            heading = HeadingStyle.CENTERED_RULE,
            dates = DateStyle.RIGHT,
            skills = SkillStyle.INLINE,
            type = Typography(
                name = TypeRole(GARAMOND, MEDIUM, 28f, caps = true, tracking = 0.06f, lineHeight = 1.1f),
                headline = TypeRole(GARAMOND, REGULAR, 13f, italic = true),
                section = TypeRole(GARAMOND, MEDIUM, 10.5f, caps = true, tracking = 0.14f),
                entryTitle = TypeRole(SOURCE_SERIF, BOLD, 10.4f),
                body = TypeRole(SOURCE_SERIF, REGULAR, 9.9f, lineHeight = 1.36f),
                meta = TypeRole(SOURCE_SERIF, REGULAR, 9.2f, italic = true),
            ),
            palette = Palette(accent = 0xFF1F4E79, ink = 0xFF1A1A1A),
            accentOptions = standardAccents,
            marginPt = 54f,
            showEntryTags = false,
        ),
        TemplateSpec(
            id = "editorial",
            name = "Editorial",
            tagline = "Magazine confidence: an oversized serif name.",
            category = TemplateCategory.CREATIVE,
            atsRating = AtsRating.VERY_GOOD,
            layout = LayoutKind.SINGLE,
            header = HeaderStyle.LEFT,
            heading = HeadingStyle.DISPLAY,
            dates = DateStyle.RIGHT,
            skills = SkillStyle.INLINE,
            type = Typography(
                name = TypeRole(FRAUNCES, MEDIUM, 38f, tracking = -0.03f, lineHeight = 1.05f),
                headline = TypeRole(INTER, REGULAR, 12f),
                section = TypeRole(FRAUNCES, MEDIUM, 15f, tracking = -0.01f),
                entryTitle = TypeRole(INTER, BOLD, 10.2f),
                body = TypeRole(INTER, REGULAR, 9.7f, lineHeight = 1.4f),
                meta = TypeRole(INTER, REGULAR, 8.8f),
            ),
            palette = Palette(accent = 0xFF8E2C48),
            accentOptions = standardAccents,
            marginPt = 52f,
        ),
        TemplateSpec(
            id = "graphite",
            name = "Graphite",
            tagline = "Bold executive header band, two columns.",
            category = TemplateCategory.CLASSIC,
            atsRating = AtsRating.GOOD,
            layout = LayoutKind.SIDEBAR_RIGHT,
            header = HeaderStyle.BAND,
            heading = HeadingStyle.CAPS_TRACKED,
            dates = DateStyle.RIGHT,
            skills = SkillStyle.LIST,
            type = sans(PLEX_SANS, nameSize = 28f),
            palette = Palette(accent = 0xFF1F4E79, bandFill = 0xFF1D1D1F),
            accentOptions = standardAccents,
            marginPt = 44f,
            photo = PhotoShape.CIRCLE,
        ),
        TemplateSpec(
            id = "atelier",
            name = "Atelier",
            tagline = "Timeline dates and room for a portrait.",
            category = TemplateCategory.CREATIVE,
            atsRating = AtsRating.GOOD,
            layout = LayoutKind.SINGLE,
            header = HeaderStyle.LEFT,
            heading = HeadingStyle.ACCENT_BAR,
            dates = DateStyle.GUTTER,
            skills = SkillStyle.TAGS,
            type = sans(DM_SANS, nameSize = 30f),
            palette = Palette(accent = 0xFFB4501E),
            accentOptions = standardAccents,
            marginPt = 46f,
            photo = PhotoShape.ROUNDED,
        ),
        TemplateSpec(
            id = "mono",
            name = "Mono",
            tagline = "Technical and crisp, with monospaced details.",
            category = TemplateCategory.MINIMAL,
            atsRating = AtsRating.EXCELLENT,
            layout = LayoutKind.SINGLE,
            header = HeaderStyle.LEFT,
            heading = HeadingStyle.CAPS_TRACKED,
            dates = DateStyle.RIGHT,
            skills = SkillStyle.TAGS,
            type = Typography(
                name = TypeRole(SPACE_GROTESK, BOLD, 28f, tracking = -0.02f, lineHeight = 1.1f),
                headline = TypeRole(JETBRAINS_MONO, REGULAR, 10.5f),
                section = TypeRole(JETBRAINS_MONO, MEDIUM, 8.8f, caps = true, tracking = 0.08f),
                entryTitle = TypeRole(SPACE_GROTESK, BOLD, 10.6f),
                body = TypeRole(INTER, REGULAR, 9.6f, lineHeight = 1.38f),
                meta = TypeRole(JETBRAINS_MONO, REGULAR, 8.2f),
            ),
            palette = Palette(accent = 0xFF0B6E4F),
            accentOptions = standardAccents,
            marginPt = 48f,
        ),

        // ---- Engineering: built for mechanical engineers ----

        TemplateSpec(
            id = "tolerance",
            name = "Tolerance",
            tagline = "Drawing-sheet border and a title block header.",
            category = TemplateCategory.ENGINEERING,
            atsRating = AtsRating.VERY_GOOD,
            layout = LayoutKind.SINGLE,
            header = HeaderStyle.TITLE_BLOCK,
            heading = HeadingStyle.RULE_BELOW,
            dates = DateStyle.RIGHT,
            skills = SkillStyle.INLINE,
            type = Typography(
                name = TypeRole(PLEX_SANS, BOLD, 22f, caps = true, tracking = 0.04f, lineHeight = 1.1f),
                headline = TypeRole(PLEX_MONO, MEDIUM, 9.5f, caps = true, tracking = 0.06f),
                section = TypeRole(PLEX_MONO, MEDIUM, 9f, caps = true, tracking = 0.1f),
                entryTitle = TypeRole(PLEX_SANS, BOLD, 10.3f),
                body = TypeRole(PLEX_SANS, REGULAR, 9.6f, lineHeight = 1.36f),
                meta = TypeRole(PLEX_MONO, REGULAR, 8.4f),
            ),
            palette = Palette(accent = 0xFF1F4E79, rule = 0xFF9AA5B1),
            accentOptions = engineeringAccents,
            marginPt = 50f,
            pageFrame = true,
        ),
        TemplateSpec(
            id = "torque",
            name = "Torque",
            tagline = "Technical toolkit sidebar for CAD, CAE and manufacturing.",
            category = TemplateCategory.ENGINEERING,
            atsRating = AtsRating.VERY_GOOD,
            layout = LayoutKind.SIDEBAR_LEFT,
            header = HeaderStyle.SPLIT,
            heading = HeadingStyle.ACCENT_BAR,
            dates = DateStyle.RIGHT,
            skills = SkillStyle.LIST,
            type = Typography(
                name = TypeRole(INTER, BOLD, 26f, tracking = -0.02f, lineHeight = 1.1f),
                headline = TypeRole(INTER, MEDIUM, 12f),
                section = TypeRole(INTER, BOLD, 8.8f, caps = true, tracking = 0.12f),
                entryTitle = TypeRole(INTER, BOLD, 10.3f),
                body = TypeRole(INTER, REGULAR, 9.5f, lineHeight = 1.38f),
                meta = TypeRole(PLEX_MONO, REGULAR, 8.4f),
            ),
            palette = Palette(accent = 0xFF34495E, sidebarFill = 0xFFEFF2F5),
            accentOptions = engineeringAccents,
            marginPt = 40f,
            sidebarFraction = 0.30f,
        ),
        TemplateSpec(
            id = "chartered",
            name = "Chartered",
            tagline = "Serif authority for PE, CEng and senior engineers.",
            category = TemplateCategory.ENGINEERING,
            atsRating = AtsRating.EXCELLENT,
            layout = LayoutKind.SINGLE,
            header = HeaderStyle.CENTER,
            heading = HeadingStyle.RULE_BELOW,
            dates = DateStyle.RIGHT,
            skills = SkillStyle.INLINE,
            type = Typography(
                name = TypeRole(SOURCE_SERIF, BOLD, 26f, tracking = -0.01f, lineHeight = 1.1f),
                headline = TypeRole(INTER, MEDIUM, 10f, caps = true, tracking = 0.12f),
                section = TypeRole(SOURCE_SERIF, BOLD, 11.5f),
                entryTitle = TypeRole(SOURCE_SERIF, BOLD, 10.4f),
                body = TypeRole(SOURCE_SERIF, REGULAR, 9.9f, lineHeight = 1.36f),
                meta = TypeRole(INTER, REGULAR, 8.6f),
            ),
            palette = Palette(accent = 0xFF1F4E79, ink = 0xFF15202B),
            accentOptions = engineeringAccents,
            marginPt = 54f,
        ),
        TemplateSpec(
            id = "datum",
            name = "Datum",
            tagline = "Numbered like a spec sheet, dates on a datum line.",
            category = TemplateCategory.ENGINEERING,
            atsRating = AtsRating.EXCELLENT,
            layout = LayoutKind.SINGLE,
            header = HeaderStyle.LEFT,
            heading = HeadingStyle.NUMBERED,
            dates = DateStyle.GUTTER,
            skills = SkillStyle.INLINE,
            type = Typography(
                name = TypeRole(SPACE_GROTESK, BOLD, 28f, tracking = -0.02f, lineHeight = 1.1f),
                headline = TypeRole(SPACE_GROTESK, MEDIUM, 12f),
                section = TypeRole(JETBRAINS_MONO, MEDIUM, 9f, caps = true, tracking = 0.08f),
                entryTitle = TypeRole(INTER, BOLD, 10.3f),
                body = TypeRole(INTER, REGULAR, 9.5f, lineHeight = 1.38f),
                meta = TypeRole(JETBRAINS_MONO, REGULAR, 8.2f),
            ),
            palette = Palette(accent = 0xFFB4501E),
            accentOptions = engineeringAccents,
            marginPt = 46f,
        ),
    )

    private val byId = all.associateBy { it.id }

    fun get(id: String): TemplateSpec = byId[id] ?: all.first()

    fun inCategory(category: TemplateCategory?): List<TemplateSpec> =
        if (category == null) all else all.filter { it.category == category }
}
