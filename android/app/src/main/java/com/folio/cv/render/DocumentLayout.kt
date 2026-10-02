package com.folio.cv.render

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.text.Layout
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.StaticLayout
import android.text.TextPaint
import com.folio.cv.model.ContactKind
import com.folio.cv.model.Dates
import com.folio.cv.model.Entry
import com.folio.cv.model.Resume
import com.folio.cv.model.Section
import com.folio.cv.model.SectionContent
import com.folio.cv.model.SectionType
import com.folio.cv.template.ContactStyle
import com.folio.cv.template.DateStyle
import com.folio.cv.template.HeaderRule
import com.folio.cv.template.HeaderStyle
import com.folio.cv.template.HeadingStyle
import com.folio.cv.template.LayoutKind
import com.folio.cv.template.NameStyle
import com.folio.cv.template.PhotoShape
import com.folio.cv.template.SkillStyle
import com.folio.cv.template.TemplateSpec
import com.folio.cv.template.TypeRole
import com.folio.cv.template.Weight
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min

class LaidOutPage(val ops: List<Placed>)

/** The single source of truth for where everything sits. Preview and PDF both draw this. */
class LaidOutDocument(val widthPt: Float, val heightPt: Float, val pages: List<LaidOutPage>) {

    fun drawPage(canvas: Canvas, index: Int, images: ImageCache) {
        canvas.drawRect(0f, 0f, widthPt, heightPt, whitePaint)
        val page = pages.getOrNull(index) ?: return
        for (placed in page.ops) {
            canvas.save()
            canvas.translate(placed.x, placed.y)
            placed.op.draw(canvas, images)
            canvas.restore()
        }
    }

    private companion object {
        val whitePaint = Paint().apply { color = Color.WHITE }
    }
}

/** A measured, unbreakable run of content. Coordinates of [items] are relative to the block. */
internal class Block(
    val height: Float,
    val spaceBefore: Float,
    val keepWithNext: Boolean,
    val items: List<Placed>,
)

internal class BlockBuilder {
    private val items = mutableListOf<Placed>()
    var height = 0f

    fun add(x: Float, y: Float, op: DrawOp) {
        items.add(Placed(x, y, op))
    }

    fun text(x: Float, y: Float, layout: StaticLayout): Float {
        add(x, y, TextOp(layout))
        return layout.height.toFloat()
    }

    fun build(spaceBefore: Float = 0f, keepWithNext: Boolean = false) = Block(height, spaceBefore, keepWithNext, items.toList())
}

/**
 * The layout engine. Turns a [Resume] plus a [TemplateSpec] into positioned pages:
 * header, columns, section headings, entries, smart page breaks (headings never end a page,
 * an entry's title always travels with its first line of content).
 */
class DocumentLayout(private val fonts: FontRegistry) {

    fun layout(resume: Resume, template: TemplateSpec): LaidOutDocument = Session(resume, template).run()

    private inner class Session(val resume: Resume, val t: TemplateSpec) {
        val w = resume.style.pageSize.widthPt
        val h = resume.style.pageSize.heightPt
        val d = resume.style.density.factor
        val margin = max(30f, t.marginPt * d)
        val contentW = w - 2 * margin

        // Mutable so a dark sidebar can swap in light-on-dark colours while its blocks are built.
        var ink = t.palette.ink.toInt()
        var secondary = t.palette.secondary.toInt()
        var rule = t.palette.rule.toInt()
        var accent = (resume.style.accent ?: t.palette.accent).toInt()
        val type = t.type

        /** Runs [block] with the sidebar's text colours when the template has a dark sidebar. */
        fun <T> sidebarColors(block: () -> T): T {
            val on = t.palette.onSidebar?.toInt() ?: return block()
            val saved = listOf(ink, secondary, rule, accent)
            ink = on
            secondary = withAlpha(on, 200)
            rule = withAlpha(on, 90)
            accent = on
            try {
                return block()
            } finally {
                ink = saved[0]; secondary = saved[1]; rule = saved[2]; accent = saved[3]
            }
        }

        fun withAlpha(color: Int, alpha: Int) = Color.argb(alpha, Color.red(color), Color.green(color), Color.blue(color))

        val sectionGap = 17f * d
        val headGap = 7f * d
        val entryGap = 10f * d
        val bulletGap = 2.4f * d

        private val pages = mutableListOf<MutableList<Placed>>()

        fun page(i: Int): MutableList<Placed> {
            while (pages.size <= i) pages.add(mutableListOf())
            return pages[i]
        }

        fun run(): LaidOutDocument {
            page(0)
            val sections = resume.visibleSections
            val bottom = h - margin * 0.9f
            val nextTop = margin

            val sidebarLayout = t.layout != LayoutKind.SINGLE
            val sidebarHeader = t.header == HeaderStyle.SIDEBAR && sidebarLayout
            val summaryFirst = t.summaryFullWidth && !sidebarHeader
            val summary = if (summaryFirst) sections.filter { it.type == SectionType.SUMMARY } else emptyList()
            val rest = sections.filterNot { it in summary }
            val contactsInSide = sidebarLayout && t.contactStyle == ContactStyle.SIDEBAR &&
                resume.header.contactItems().isNotEmpty()
            val sideSections = if (sidebarLayout) rest.filter { it.type in t.sidebarSections } else emptyList()
            val useSidebar = sideSections.isNotEmpty() || contactsInSide || sidebarHeader
            val mainSections = if (useSidebar) rest.filterNot { it.type in t.sidebarSections } else rest

            val gap = (if (sidebarHeader) 32f else 22f) * d
            val sideW = if (useSidebar) contentW * t.sidebarFraction else 0f
            val mainW = if (useSidebar) contentW - sideW - gap else contentW
            val leftSide = t.layout == LayoutKind.SIDEBAR_LEFT
            val sideX = if (leftSide) margin else margin + mainW + gap
            val mainX = if (useSidebar && leftSide) margin + sideW + gap else margin
            val divider = if (leftSide) margin + sideW + gap / 2 else margin + mainW + gap / 2

            var headerBottom = if (sidebarHeader) headerSidebar(mainX, mainW) else header()
            if (t.headerRule != HeaderRule.NONE && !sidebarHeader) {
                val ry = headerBottom - 6f * d
                page(0).add(
                    Placed(
                        0f, 0f,
                        if (t.headerRule == HeaderRule.THICK) LineOp(0f, ry, w, ry, rule, 4f)
                        else LineOp(margin, ry, margin + contentW, ry, secondary, 0.6f),
                    ),
                )
                headerBottom += 16f * d
            }

            var colPage = 0
            var colTop = headerBottom
            if (summary.isNotEmpty()) {
                val blocks = summary.flatMapIndexed { i, sct -> sectionBlocks(sct, contentW, inSidebar = false, number = i + 1, first = i == 0) }
                val (p, y) = flow(blocks, margin, headerBottom, nextTop, bottom)
                colPage = p
                colTop = y + sectionGap * 1.3f
            }

            if (useSidebar) {
                var sideTop = colTop
                if (sidebarHeader) {
                    sideTop = margin
                    photoPath()?.let { photo ->
                        val size = min(sideW * 0.8f, 124f)
                        page(0).add(Placed(0f, 0f, PhotoOp(photo, sideX + (sideW - size) / 2, margin, size, t.photo)))
                        sideTop = margin + size + 24f * d
                    }
                }
                val sideBlocks = sidebarColors {
                    val list = mutableListOf<Block>()
                    if (contactsInSide) list.addAll(contactSectionBlocks(sideW))
                    sideSections.forEachIndexed { i, sct ->
                        list.addAll(sectionBlocks(sct, sideW, inSidebar = true, number = i + 1, first = i == 0 && !contactsInSide))
                    }
                    list
                }
                flow(sideBlocks, sideX, sideTop, nextTop, bottom, startPage = colPage)
            }
            val mainBlocks = mainSections.flatMapIndexed { i, sct -> sectionBlocks(sct, mainW, inSidebar = false, number = i + 1, first = i == 0) }
            flow(mainBlocks, mainX, colTop, nextTop, bottom, startPage = colPage)

            val count = pages.size
            val result = pages.mapIndexed { index, ops ->
                val background = mutableListOf<Placed>()
                if (useSidebar && index >= colPage) {
                    val top = when {
                        sidebarHeader || index > colPage -> 0f
                        else -> colTop - 12f * d
                    }
                    if (t.sidebarBackground) {
                        // A dark sidebar is the template's accent, so changing the accent recolours it.
                        val fillColor = if (t.palette.onSidebar != null) {
                            (resume.style.accent ?: t.palette.sidebarFill ?: t.palette.accent).toInt()
                        } else (t.palette.sidebarFill ?: 0xFFF5F5F7).toInt()
                        val (l, r) = if (leftSide) 0f to divider else divider to w
                        background.add(Placed(0f, 0f, RectOp(l, top, r, h, fillColor)))
                    }
                    if (t.columnRule) {
                        val ruleTop = if (top == 0f) margin else colTop
                        background.add(Placed(0f, 0f, LineOp(divider, ruleTop, divider, bottom, secondary, 0.6f)))
                    }
                }
                if (t.pageFrame) background.addAll(frame(index, count))
                val footer = mutableListOf<Placed>()
                if (count > 1 && index > 0 && !t.pageFrame) {
                    val p = paint(type.meta, secondary)
                    val label = "${resume.header.fullName.ifBlank { resume.name }}  ·  ${index + 1} / $count"
                    val fx = if (useSidebar && t.palette.onSidebar != null && !leftSide) margin else w - margin - p.measureText(label)
                    footer.add(Placed(0f, 0f, LabelOp(label, p, fx, h - margin * 0.45f)))
                }
                LaidOutPage(background + ops + footer)
            }
            return LaidOutDocument(w, h, result)
        }

        // ---------------------------------------------------------------- flow

        /** Places blocks top to bottom, breaking pages so keep-with-next chains never split. */
        fun flow(blocks: List<Block>, x: Float, firstTop: Float, nextTop: Float, bottom: Float, startPage: Int = 0): Pair<Int, Float> {
            var pageIndex = startPage
            var y = firstTop
            var top = firstTop
            var i = 0
            while (i < blocks.size) {
                val b = blocks[i]
                val atTop = y <= top + 0.5f
                val sb = if (atTop) 0f else b.spaceBefore
                var need = sb + b.height
                var j = i
                while (blocks[j].keepWithNext && j + 1 < blocks.size) {
                    j++
                    need += blocks[j].spaceBefore + blocks[j].height
                }
                if (y + need > bottom && !atTop) {
                    pageIndex++
                    y = nextTop
                    top = nextTop
                    continue
                }
                val target = page(pageIndex)
                for (item in b.items) target.add(Placed(x + item.x, y + sb + item.y, item.op))
                y += sb + b.height
                i++
            }
            return pageIndex to y
        }

        // ---------------------------------------------------------------- text helpers

        fun paint(role: TypeRole, color: Int): TextPaint =
            TextPaint(Paint.ANTI_ALIAS_FLAG or Paint.SUBPIXEL_TEXT_FLAG or Paint.LINEAR_TEXT_FLAG).apply {
                typeface = fonts.typeface(role)
                textSize = role.sizePt
                this.color = color
                letterSpacing = role.tracking
            }

        fun cased(text: String, role: TypeRole) = if (role.caps) text.uppercase() else text

        fun layout(
            text: CharSequence,
            paint: TextPaint,
            width: Float,
            role: TypeRole,
            align: Layout.Alignment = Layout.Alignment.ALIGN_NORMAL,
        ): StaticLayout {
            val fm = paint.fontMetrics
            val natural = fm.descent - fm.ascent
            val extra = paint.textSize * role.lineHeight - natural
            return StaticLayout.Builder.obtain(text, 0, text.length, paint, max(1, floor(width).toInt()))
                .setAlignment(align)
                .setIncludePad(false)
                .setLineSpacing(extra, 1f)
                .setBreakStrategy(Layout.BREAK_STRATEGY_HIGH_QUALITY)
                .setHyphenationFrequency(Layout.HYPHENATION_FREQUENCY_NONE)
                .build()
        }

        fun nameText(color: Int, credentialColor: Int): CharSequence {
            val name = resume.header.fullName.trim().ifBlank { "Your Name" }
            val parts = name.split(Regex("\\s+"), limit = 2)
            val stacked = t.nameStyle != NameStyle.INLINE && parts.size == 2
            val sb = SpannableStringBuilder(cased(if (stacked) parts[0] + "\n" + parts[1] else name, type.name))
            if (stacked && t.nameStyle == NameStyle.BOLD_LIGHT) {
                sb.setSpan(FontSpan(fonts.get(type.name.family, Weight.LIGHT)), parts[0].length + 1, sb.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            }
            val creds = resume.header.credentials.trim()
            if (creds.isNotEmpty()) {
                val start = sb.length
                sb.append(", ").append(creds)
                sb.setSpan(
                    FontSpan(fonts.get(type.name.family, Weight.REGULAR), type.name.sizePt * 0.46f, credentialColor, 0.02f),
                    start, sb.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE,
                )
            }
            return sb
        }

        val nameColor: Int get() = if (resume.header.fullName.isBlank()) secondary else ink

        fun contactLine(separator: String): String =
            resume.header.contactItems().joinToString(separator) { it.value }

        /** Contact items packed greedily into lines so a line only ever breaks between items. */
        fun contactLines(separator: String, paint: TextPaint, width: Float): String {
            val lines = mutableListOf<String>()
            var line = ""
            for (item in resume.header.contactItems().map { it.value }) {
                val candidate = if (line.isEmpty()) item else line + separator + item
                if (line.isNotEmpty() && paint.measureText(candidate) > width) {
                    lines.add(line)
                    line = item
                } else line = candidate
            }
            if (line.isNotEmpty()) lines.add(line)
            return lines.joinToString("\n")
        }

        // ---------------------------------------------------------------- header

        fun header(): Float = when (t.header) {
            HeaderStyle.LEFT -> headerStacked(Layout.Alignment.ALIGN_NORMAL)
            HeaderStyle.CENTER -> headerStacked(Layout.Alignment.ALIGN_CENTER)
            HeaderStyle.SPLIT -> headerSplit()
            HeaderStyle.BAND -> headerBand()
            HeaderStyle.TITLE_BLOCK -> headerTitleBlock()
            HeaderStyle.PHOTO_LEFT -> headerPhotoLeft()
            // Without a sidebar column there is nowhere for the photo to go: fall back to a plain header.
            HeaderStyle.SIDEBAR -> headerStacked(Layout.Alignment.ALIGN_NORMAL)
        }

        /** The sidebar lists the contacts, so headers leave them out. */
        val contactsInSidebar: Boolean
            get() = t.contactStyle == ContactStyle.SIDEBAR && t.layout != LayoutKind.SINGLE

        fun photoPath(): String? =
            resume.header.photoPath?.takeIf { t.photo != PhotoShape.NONE && resume.style.showPhoto }

        fun headerStacked(align: Layout.Alignment): Float {
            val out = page(0)
            val top = margin
            val centered = align == Layout.Alignment.ALIGN_CENTER
            val photo = if (centered) null else photoPath()
            val photoSize = 72f
            val textW = if (photo != null) contentW - photoSize - 16f else contentW
            var y = top
            if (centered) photoPath()?.let {
                val size = 80f
                out.add(Placed(0f, 0f, PhotoOp(it, margin + (contentW - size) / 2, y, size, t.photo)))
                y += size + 14f * d
            }

            val nameL = layout(nameText(nameColor, secondary), paint(type.name, nameColor), textW, type.name, align)
            out.add(Placed(margin, y, TextOp(nameL)))
            y += nameL.height
            if (resume.header.headline.isNotBlank()) {
                y += 4f * d
                val hl = layout(cased(resume.header.headline, type.headline), paint(type.headline, secondary), textW, type.headline, align)
                out.add(Placed(margin, y, TextOp(hl)))
                y += hl.height
            }
            val metaPaint = paint(type.meta, secondary)
            val contacts = if (contactsInSidebar) "" else contactLines(if (centered) "   |   " else "   ·   ", metaPaint, textW)
            if (t.contactStyle != ContactStyle.LINE && !centered) {
                if (contacts.isNotEmpty()) {
                    y += 10f * d
                    y += iconContacts(out, margin, y, textW)
                }
            } else if (contacts.isNotEmpty()) {
                y += 7f * d
                val cl = layout(contacts, metaPaint, textW, type.meta, align)
                out.add(Placed(margin, y, TextOp(cl)))
                y += cl.height
            }
            if (photo != null) {
                out.add(Placed(0f, 0f, PhotoOp(photo, margin + contentW - photoSize, top, photoSize, t.photo)))
                y = max(y, top + photoSize)
            }
            if (centered) {
                y += 12f * d
                out.add(Placed(0f, 0f, LineOp(margin, y, margin + contentW, y, rule, 0.6f)))
                y += 2f
            }
            return y + 20f * d
        }

        /** Name, headline and contacts for a block of text at [x]; returns the ops and the height. */
        fun nameBlock(x: Float, width: Float, contacts: Boolean): Pair<List<Placed>, Float> {
            val out = mutableListOf<Placed>()
            var y = 0f
            val nameL = layout(nameText(nameColor, secondary), paint(type.name, nameColor), width, type.name)
            out.add(Placed(x, y, TextOp(nameL)))
            y += nameL.height
            if (resume.header.headline.isNotBlank()) {
                y += 5f * d
                val hl = layout(cased(resume.header.headline, type.headline), paint(type.headline, secondary), width, type.headline)
                out.add(Placed(x, y, TextOp(hl)))
                y += hl.height
            }
            if (contacts && resume.header.contactItems().isNotEmpty()) {
                y += 12f * d
                if (t.contactStyle == ContactStyle.LINE) {
                    val mp = paint(type.meta, secondary)
                    val cl = layout(contactLines("   ·   ", mp, width), mp, width, type.meta)
                    out.add(Placed(x, y, TextOp(cl)))
                    y += cl.height
                } else {
                    y += iconContacts(out, x, y, width)
                }
            }
            return out to y
        }

        /** A large photo on a soft ring, with the name block centred beside it. */
        fun headerPhotoLeft(): Float {
            val out = page(0)
            val top = margin
            val photo = photoPath()
            val size = 96f
            val ring = 6f
            val textX = if (photo != null) margin + size + 2 * ring + 28f * d else margin
            val (items, textH) = nameBlock(0f, margin + contentW - textX, contacts = !contactsInSidebar)
            val blockH = max(textH, if (photo != null) size + 2 * ring else 0f)
            val textTop = top + (blockH - textH) / 2
            if (photo != null) {
                val photoTop = top + (blockH - size) / 2
                out.add(Placed(0f, 0f, CircleOp(margin + ring + size / 2, photoTop + size / 2, size / 2 + ring, withAlpha(rule, 150))))
                out.add(Placed(0f, 0f, PhotoOp(photo, margin + ring, photoTop, size, t.photo)))
            }
            items.forEach { out.add(Placed(textX + it.x, textTop + it.y, it.op)) }
            return top + blockH + 24f * d
        }

        /** The main column's opening: name and headline (and contacts unless the sidebar carries them). */
        fun headerSidebar(x: Float, width: Float): Float {
            val (items, height) = nameBlock(x, width, contacts = !contactsInSidebar)
            page(0).addAll(items.map { Placed(it.x, margin + it.y, it.op) })
            return margin + height + 24f * d
        }

        /**
         * Contact items with a drawn icon each, in two columns when they fit side by side.
         * Adds ops to [out] at absolute positions and returns the height used.
         */
        fun iconContacts(out: MutableList<Placed>, x: Float, top: Float, width: Float): Float {
            val items = resume.header.contactItems()
            if (items.isEmpty()) return 0f
            val p = paint(type.meta, secondary)
            val iconSize = type.meta.sizePt * 1.1f
            val iconGap = 6f
            val colGap = 24f
            fun cellW(i: Int) = iconSize + iconGap + p.measureText(items[i].value)
            val firstCol = items.indices.filter { it % 2 == 0 }.maxOf { cellW(it) }
            val secondCol = items.indices.filter { it % 2 == 1 }.maxOfOrNull { cellW(it) } ?: 0f
            val cols = if (items.size > 1 && firstCol + colGap + secondCol <= width) 2 else 1
            val rowGap = 5f * d
            var y = top
            items.chunked(cols).forEach { row ->
                var rowH = 0f
                row.forEachIndexed { c, item ->
                    val cx = x + if (c == 1) firstCol + colGap else 0f
                    val l = layout(item.value, p, width - (cx - x) - iconSize - iconGap, type.meta)
                    out.add(Placed(cx + iconSize + iconGap, y, TextOp(l)))
                    val mid = y + l.getLineBaseline(0) - type.meta.sizePt * 0.34f
                    out.add(Placed(0f, 0f, IconOp(item.kind, cx, mid - iconSize / 2, iconSize, accent)))
                    rowH = max(rowH, l.height.toFloat())
                }
                y += rowH + rowGap
            }
            return y - rowGap - top
        }

        /** A "Contact" section for the sidebar: one icon and value per line. */
        fun contactSectionBlocks(width: Float): List<Block> {
            val blocks = mutableListOf(headingBlock("Contact", width, 0, 0f))
            val p = paint(type.meta, ink)
            val iconSize = type.meta.sizePt * 1.1f
            val iconGap = 7f
            resume.header.contactItems().forEachIndexed { i, item ->
                val b = BlockBuilder()
                val l = layout(item.value, p, width - iconSize - iconGap, type.meta)
                b.height = b.text(iconSize + iconGap, 0f, l)
                val mid = l.getLineBaseline(0) - type.meta.sizePt * 0.34f
                b.add(0f, 0f, IconOp(item.kind, 0f, mid - iconSize / 2, iconSize, accent))
                blocks.add(b.build(if (i == 0) headGap else 6f * d))
            }
            return blocks
        }

        fun headerSplit(): Float {
            val out = page(0)
            val top = margin
            val leftW = contentW * 0.6f
            val rightW = contentW - leftW
            var y = top
            val nameL = layout(nameText(nameColor, secondary), paint(type.name, nameColor), leftW, type.name)
            out.add(Placed(margin, y, TextOp(nameL)))
            y += nameL.height
            if (resume.header.headline.isNotBlank()) {
                y += 4f * d
                val hl = layout(cased(resume.header.headline, type.headline), paint(type.headline, secondary), leftW, type.headline)
                out.add(Placed(margin, y, TextOp(hl)))
                y += hl.height
            }
            val contacts = resume.header.contactItems().joinToString("\n") { it.value }
            var right = top
            if (contacts.isNotEmpty()) {
                val cl = layout(contacts, paint(type.meta, secondary), rightW, type.meta, Layout.Alignment.ALIGN_OPPOSITE)
                out.add(Placed(margin + leftW, top + 2f, TextOp(cl)))
                right = top + 2f + cl.height
            }
            y = max(y, right) + 12f * d
            out.add(Placed(0f, 0f, LineOp(margin, y, margin + contentW, y, accent, 1.4f)))
            return y + 20f * d
        }

        fun headerBand(): Float {
            val out = page(0)
            val band = (t.palette.bandFill ?: 0xFF1D1D1F).toInt()
            val onBand = t.palette.onBand.toInt()
            val onBandSoft = Color.argb(200, Color.red(onBand), Color.green(onBand), Color.blue(onBand))
            val photo = photoPath()
            val photoSize = 68f
            val textW = if (photo != null) contentW - photoSize - 16f else contentW
            val top = margin * 0.85f
            var y = top
            val items = mutableListOf<Placed>()
            val nameL = layout(nameText(onBand, onBandSoft), paint(type.name, onBand), textW, type.name)
            items.add(Placed(margin, y, TextOp(nameL)))
            y += nameL.height
            if (resume.header.headline.isNotBlank()) {
                y += 4f * d
                val hl = layout(cased(resume.header.headline, type.headline), paint(type.headline, onBandSoft), textW, type.headline)
                items.add(Placed(margin, y, TextOp(hl)))
                y += hl.height
            }
            val bandMeta = paint(type.meta, onBandSoft)
            val contacts = contactLines("   ·   ", bandMeta, textW)
            if (contacts.isNotEmpty()) {
                y += 8f * d
                val cl = layout(contacts, bandMeta, textW, type.meta)
                items.add(Placed(margin, y, TextOp(cl)))
                y += cl.height
            }
            if (photo != null) {
                items.add(Placed(0f, 0f, PhotoOp(photo, margin + contentW - photoSize, top, photoSize, t.photo)))
                y = max(y, top + photoSize)
            }
            val bandBottom = y + margin * 0.6f
            out.add(Placed(0f, 0f, RectOp(0f, 0f, w, bandBottom, band)))
            out.add(Placed(0f, 0f, RectOp(0f, bandBottom, w, bandBottom + 3f, accent)))
            out.addAll(items)
            return bandBottom + 3f + 24f * d
        }

        /** Engineering drawing title block: a ruled table with labelled cells. */
        fun headerTitleBlock(): Float {
            val out = page(0)
            val x0 = margin
            val top = margin
            val pad = 6f
            val labelPaint = paint(type.meta.copy(sizePt = 5.8f, caps = true, tracking = 0.12f), secondary)
            val labelH = 5.8f * 1.6f
            val cells = mutableListOf<Placed>()

            fun cell(label: String, x: Float, y: Float, width: Float, content: StaticLayout?): Float {
                cells.add(Placed(0f, 0f, LabelOp(label.uppercase(), labelPaint, x + pad, y + pad + 5.8f)))
                var hh = pad + labelH
                if (content != null) {
                    cells.add(Placed(x + pad, y + hh + 1f, TextOp(content)))
                    hh += content.height + 1f
                }
                return hh + pad
            }

            val nameW = contentW * 0.62f
            val discW = contentW - nameW
            val nameL = layout(nameText(nameColor, secondary), paint(type.name, nameColor), nameW - 2 * pad, type.name)
            val disc = resume.header.headline.ifBlank { "Mechanical Engineering" }
            val discL = layout(cased(disc, type.headline), paint(type.headline, ink), discW - 2 * pad, type.headline)
            val row1 = max(cell("Name", x0, top, nameW, nameL), cell("Discipline", x0 + nameW, top, discW, discL))

            val contacts = resume.header.contactItems().take(4)
            var row2 = 0f
            if (contacts.isNotEmpty()) {
                val valuePaint = paint(type.meta, ink)
                val natural = contacts.map { max(valuePaint.measureText(it.value), 48f) + 2 * pad }
                val scale = contentW / natural.sum()
                val widths = natural.map { it * scale }
                val lefts = widths.runningFold(x0) { acc, cw -> acc + cw }
                contacts.forEachIndexed { i, item ->
                    val label = when (item.kind) {
                        ContactKind.EMAIL -> "Email"
                        ContactKind.PHONE -> "Phone"
                        ContactKind.LOCATION -> "Location"
                        ContactKind.WEBSITE -> "Web"
                        ContactKind.LINKEDIN -> "LinkedIn"
                        ContactKind.GITHUB -> "GitHub"
                    }
                    val vl = layout(item.value, valuePaint, widths[i] - 2 * pad, type.meta)
                    row2 = max(row2, cell(label, lefts[i], top + row1, widths[i], vl))
                }
                for (i in 1 until contacts.size) {
                    val lx = lefts[i]
                    out.add(Placed(0f, 0f, LineOp(lx, top + row1, lx, top + row1 + row2, rule, 0.5f)))
                }
                out.add(Placed(0f, 0f, LineOp(x0, top + row1, x0 + contentW, top + row1, rule, 0.5f)))
            }
            val bottomY = top + row1 + row2
            out.add(Placed(0f, 0f, LineOp(x0 + nameW, top, x0 + nameW, top + row1, rule, 0.5f)))
            out.add(Placed(0f, 0f, RectOp(x0, top, x0 + contentW, bottomY, ink, strokeWidth = 0.9f)))
            out.addAll(cells)
            return bottomY + 22f * d
        }

        /** Drawing-sheet border with zone ticks (1-6 across, A-D down) and a sheet number. */
        fun frame(index: Int, count: Int): List<Placed> {
            val ops = mutableListOf<Placed>()
            val outer = 16f
            val inner = 26f
            ops.add(Placed(0f, 0f, RectOp(outer, outer, w - outer, h - outer, rule, strokeWidth = 0.5f)))
            ops.add(Placed(0f, 0f, RectOp(inner, inner, w - inner, h - inner, ink, strokeWidth = 0.9f)))
            val zonePaint = paint(type.meta.copy(sizePt = 5.5f, tracking = 0f), secondary)
            val cols = 6
            val rows = 4
            val zw = (w - 2 * inner) / cols
            val zh = (h - 2 * inner) / rows
            for (c in 0..cols) {
                val x = inner + c * zw
                if (c in 1 until cols) {
                    ops.add(Placed(0f, 0f, LineOp(x, outer, x, inner, rule, 0.5f)))
                    ops.add(Placed(0f, 0f, LineOp(x, h - inner, x, h - outer, rule, 0.5f)))
                }
                if (c < cols) {
                    val label = (cols - c).toString()
                    val lx = x + zw / 2 - zonePaint.measureText(label) / 2
                    ops.add(Placed(0f, 0f, LabelOp(label, zonePaint, lx, outer + 7.5f)))
                    ops.add(Placed(0f, 0f, LabelOp(label, zonePaint, lx, h - outer - 3f)))
                }
            }
            for (r in 0..rows) {
                val y = inner + r * zh
                if (r in 1 until rows) {
                    ops.add(Placed(0f, 0f, LineOp(outer, y, inner, y, rule, 0.5f)))
                    ops.add(Placed(0f, 0f, LineOp(w - inner, y, w - outer, y, rule, 0.5f)))
                }
                if (r < rows) {
                    val label = ('A' + (rows - 1 - r)).toString()
                    val ly = y + zh / 2 + 2f
                    ops.add(Placed(0f, 0f, LabelOp(label, zonePaint, outer + 3f, ly)))
                    ops.add(Placed(0f, 0f, LabelOp(label, zonePaint, w - outer - 7f, ly)))
                }
            }
            val sheetPaint = paint(type.meta.copy(sizePt = 6.5f, caps = true, tracking = 0.1f), secondary)
            val sheet = "SHEET ${index + 1} OF $count"
            ops.add(Placed(0f, 0f, LabelOp(sheet, sheetPaint, w - inner - 8f - sheetPaint.measureText(sheet), h - inner - 8f)))
            return ops
        }

        // ---------------------------------------------------------------- sections

        fun sectionBlocks(section: Section, width: Float, inSidebar: Boolean, number: Int, first: Boolean): List<Block> {
            val blocks = mutableListOf(headingBlock(section.title, width, number, if (first) 0f else sectionGap))
            when (section.type.content) {
                SectionContent.TEXT -> section.text.split(Regex("\\n\\s*\\n")).map { it.trim() }.filter { it.isNotEmpty() }
                    .forEachIndexed { i, para ->
                        val role = if (inSidebar) type.body.copy(sizePt = type.body.sizePt * 0.94f) else type.body
                        val b = BlockBuilder()
                        b.height = b.text(0f, 0f, layout(para, paint(role, ink), width, role))
                        blocks.add(b.build(spaceBefore = if (i == 0) headGap else 5f * d))
                    }
                SectionContent.GROUPS -> blocks.addAll(groupBlocks(section, width))
                SectionContent.ENTRIES -> if (section.type == SectionType.REFERENCES && !inSidebar && width > 280f) {
                    blocks.addAll(referenceBlocks(section.entries.filterNot { it.isBlank }, width))
                } else {
                    val style = when {
                        inSidebar -> DateStyle.BELOW
                        section.type == SectionType.CERTIFICATIONS && t.dates == DateStyle.GUTTER -> DateStyle.RIGHT
                        else -> t.dates
                    }
                    section.entries.filterNot { it.isBlank }.forEachIndexed { i, entry ->
                        blocks.addAll(entryBlocks(entry, width, style, if (i == 0) headGap else entryGap, compact = inSidebar, first = i == 0))
                    }
                }
            }
            return blocks
        }

        /** References side by side, two to a row: name, role, then contact lines. */
        fun referenceBlocks(entries: List<Entry>, width: Float): List<Block> {
            val gap = 20f
            val colW = (width - gap) / 2
            return entries.chunked(2).mapIndexed { row, pair ->
                val b = BlockBuilder()
                var tallest = 0f
                pair.forEachIndexed { c, e ->
                    val x = c * (colW + gap)
                    var y = b.text(x, 0f, layout(e.title.ifBlank { e.organization }, paint(type.entryTitle, ink), colW, type.entryTitle))
                    val org = if (e.title.isBlank()) "" else listOf(e.organization, e.location).filter { it.isNotBlank() }.joinToString(", ")
                    if (org.isNotEmpty()) {
                        y += 1.5f * d
                        y += b.text(x, y, layout(org, paint(type.body, secondary), colW, type.body))
                    }
                    if (e.description.isNotBlank()) {
                        y += 3f * d
                        y += b.text(x, y, layout(e.description.trim(), paint(type.meta, secondary), colW, type.meta))
                    }
                    tallest = max(tallest, y)
                }
                b.height = tallest
                b.build(if (row == 0) headGap else entryGap)
            }
        }

        fun headingBlock(title: String, width: Float, number: Int, spaceBefore: Float): Block {
            val role = type.section
            val text = cased(title.ifBlank { "Untitled" }, role)
            val b = BlockBuilder()
            when (t.heading) {
                HeadingStyle.CAPS_TRACKED -> b.height = b.text(0f, 0f, layout(text, paint(role, accent), width, role))
                HeadingStyle.DISPLAY -> b.height = b.text(0f, 0f, layout(text, paint(role, ink), width, role))
                HeadingStyle.RULE_BELOW -> {
                    val lh = b.text(0f, 0f, layout(text, paint(role, accent), width, role))
                    val ry = lh + 3.5f * d
                    b.add(0f, 0f, LineOp(0f, ry, width, ry, accent, 0.6f))
                    b.height = ry + 0.6f
                }
                HeadingStyle.CENTERED_RULE -> {
                    val p = paint(role, ink)
                    val l = layout(text, p, width, role, Layout.Alignment.ALIGN_CENTER)
                    b.height = b.text(0f, 0f, l)
                    val textW = min(width, p.measureText(text))
                    val midY = l.getLineBaseline(0) - role.sizePt * 0.33f
                    val gap = 10f
                    val leftEnd = (width - textW) / 2 - gap
                    if (leftEnd > 8f) {
                        b.add(0f, 0f, LineOp(0f, midY, leftEnd, midY, rule, 0.6f))
                        b.add(0f, 0f, LineOp((width + textW) / 2 + gap, midY, width, midY, rule, 0.6f))
                    }
                }
                HeadingStyle.ACCENT_BAR -> {
                    val indent = 9f
                    val l = layout(text, paint(role, ink), width - indent, role)
                    b.height = b.text(indent, 0f, l)
                    b.add(0f, 0f, RectOp(0f, 1f, 3f, l.height - 1f, accent, radius = 1.5f))
                }
                HeadingStyle.UNDERLINE -> {
                    val lh = b.text(0f, 0f, layout(text, paint(role, ink), width, role))
                    val ry = lh + 4f * d
                    b.add(0f, 0f, LineOp(0f, ry, width, ry, secondary, 0.7f))
                    b.height = ry + 0.7f
                }
                HeadingStyle.NUMBERED -> {
                    val numberText = "$number.0"
                    val np = paint(role, accent)
                    val indent = np.measureText("00.0") + 8f
                    b.text(0f, 0f, layout(numberText, np, indent, role))
                    val lh = b.text(indent, 0f, layout(text, paint(role, ink), width - indent, role))
                    val ry = lh + 3.5f * d
                    b.add(0f, 0f, LineOp(0f, ry, width, ry, rule, 0.6f))
                    b.height = ry + 0.6f
                }
            }
            return b.build(spaceBefore, keepWithNext = true)
        }

        fun entryBlocks(e: Entry, width: Float, style: DateStyle, spaceBefore: Float, compact: Boolean, first: Boolean): List<Block> {
            val date = Dates.range(e.start, e.end, e.current, resume.style.dateFormat)
            val title = e.title.ifBlank { e.organization }
            val org = if (e.title.isBlank()) e.location
            else listOf(e.organization, e.location).filter { it.isNotBlank() }.joinToString("  ·  ")
            val titleRole = if (compact) type.entryTitle.copy(sizePt = type.entryTitle.sizePt * 0.92f) else type.entryTitle
            val bodyRole = if (compact) type.body.copy(sizePt = type.body.sizePt * 0.94f) else type.body

            val head = BlockBuilder()
            var indent = 0f
            var y = 0f
            val markerX = 4f
            val markerR = 3.2f
            when (style) {
                DateStyle.TIMELINE -> {
                    indent = 17f
                    var markerY: Float
                    if (date.isNotEmpty()) {
                        val dateRole = type.meta.copy(weight = Weight.BOLD)
                        val dl = layout(date, paint(dateRole, if (e.current) accent else secondary), width - indent, dateRole)
                        y += head.text(indent, 0f, dl) + 2f * d
                        markerY = dl.getLineBaseline(0) - dateRole.sizePt * 0.34f
                        val tl = layout(title, paint(titleRole, ink), width - indent, titleRole)
                        y += head.text(indent, y, tl)
                    } else {
                        val tl = layout(title, paint(titleRole, ink), width - indent, titleRole)
                        y += head.text(indent, 0f, tl)
                        markerY = tl.getLineBaseline(0) - titleRole.sizePt * 0.34f
                    }
                    if (org.isNotEmpty()) {
                        y += 1.5f * d
                        y += head.text(indent, y, layout(org, paint(bodyRole, secondary), width - indent, bodyRole))
                    }
                    head.add(0f, 0f, CircleOp(markerX, markerY, markerR, accent, strokeWidth = 1.2f))
                    head.add(0f, 0f, LineOp(markerX, markerY + markerR + 1.5f, markerX, y, rule, 1f))
                    if (!first) head.add(0f, 0f, LineOp(markerX, -spaceBefore, markerX, markerY - markerR - 1.5f, rule, 1f))
                }
                DateStyle.RIGHT -> {
                    val dp = paint(type.meta, secondary)
                    val dateW = if (date.isEmpty()) 0f else dp.measureText(date)
                    val tl = layout(title, paint(titleRole, ink), width - dateW - if (dateW > 0f) 12f else 0f, titleRole)
                    y += head.text(0f, 0f, tl)
                    if (date.isNotEmpty()) head.add(0f, 0f, LabelOp(date, dp, width - dateW, tl.getLineBaseline(0).toFloat()))
                    if (org.isNotEmpty()) {
                        y += 1.5f * d
                        y += head.text(0f, y, layout(org, paint(bodyRole, secondary), width, bodyRole))
                    }
                }
                DateStyle.BELOW -> {
                    y += head.text(0f, 0f, layout(title, paint(titleRole, ink), width, titleRole))
                    if (org.isNotEmpty()) {
                        y += 1.5f * d
                        y += head.text(0f, y, layout(org, paint(bodyRole, secondary), width, bodyRole))
                    }
                    if (date.isNotEmpty()) {
                        y += 1.5f * d
                        y += head.text(0f, y, layout(date, paint(type.meta, secondary), width, type.meta))
                    }
                }
                DateStyle.GUTTER -> {
                    indent = min(86f, width * 0.2f)
                    val tl = layout(title, paint(titleRole, ink), width - indent, titleRole)
                    y += head.text(indent, 0f, tl)
                    var dateBottom = 0f
                    if (date.isNotEmpty()) {
                        val dp = paint(type.meta, if (e.current) accent else secondary)
                        val dateW = indent - 10f
                        // A range that does not fit stacks at the dash rather than wherever the line runs out.
                        val text = if (dp.measureText(date) > dateW) date.replace(" – ", " –\n") else date
                        val dl = layout(text, dp, dateW, type.meta)
                        val shift = (tl.getLineBaseline(0) - dl.getLineBaseline(0)).toFloat()
                        head.text(0f, shift, dl)
                        dateBottom = shift + dl.height
                    }
                    if (org.isNotEmpty()) {
                        y += 1.5f * d
                        y += head.text(indent, y, layout(org, paint(bodyRole, secondary), width - indent, bodyRole))
                    }
                    y = max(y, dateBottom)
                }
            }
            head.height = y

            val rest = mutableListOf<Block>()
            val innerW = width - indent
            if (e.description.isNotBlank()) {
                val b = BlockBuilder()
                b.height = b.text(indent, 0f, layout(e.description.trim(), paint(bodyRole, ink), innerW, bodyRole))
                rest.add(b.build(spaceBefore = 3.5f * d))
            }
            e.bullets.map { it.trim() }.filter { it.isNotEmpty() }.forEachIndexed { i, text ->
                rest.add(bulletBlock(text, indent, innerW, bodyRole, if (i == 0) 3.5f * d else bulletGap))
            }
            if (t.showEntryTags && e.tags.isNotEmpty()) {
                val b = BlockBuilder()
                b.height = b.text(indent, 0f, layout(e.tags.joinToString("  ·  "), paint(type.meta, secondary), innerW, type.meta))
                rest.add(b.build(spaceBefore = 3.5f * d))
            }
            val body = if (style != DateStyle.TIMELINE) rest else rest.map { b ->
                // Carry the timeline down through the entry's text, bridging the gap above each block.
                Block(b.height, b.spaceBefore, b.keepWithNext, b.items + Placed(0f, 0f, LineOp(markerX, -b.spaceBefore, markerX, b.height, rule, 1f)))
            }
            return listOf(head.build(spaceBefore, keepWithNext = body.isNotEmpty())) + body
        }

        fun bulletBlock(text: String, indent: Float, width: Float, role: TypeRole, spaceBefore: Float): Block {
            val b = BlockBuilder()
            val hang = role.sizePt * 1.1f
            val l = layout(text, paint(role, ink), width - hang, role)
            b.height = b.text(indent + hang, 0f, l)
            val glyphPaint = paint(role.copy(tracking = 0f), accent)
            b.add(indent, 0f, LabelOp(t.bulletGlyph, glyphPaint, 0f, l.getLineBaseline(0).toFloat()))
            return b.build(spaceBefore)
        }

        fun groupBlocks(section: Section, width: Float): List<Block> {
            val groups = section.groups.map { g -> g.copy(items = g.items.map { it.trim() }.filter { it.isNotEmpty() }) }
                .filter { it.items.isNotEmpty() }
            val style = if (section.type == SectionType.LANGUAGES && t.skills == SkillStyle.TAGS) SkillStyle.INLINE else t.skills
            return groups.mapIndexed { i, g ->
                val sb = if (i == 0) headGap else if (style == SkillStyle.INLINE) 3.5f * d else 8f * d
                when (style) {
                    SkillStyle.INLINE -> {
                        val text = SpannableStringBuilder()
                        if (g.name.isNotBlank()) {
                            text.append(g.name.trim())
                            text.setSpan(
                                FontSpan(fonts.get(type.body.family, Weight.BOLD), color = ink),
                                0, text.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE,
                            )
                            text.append(":  ")
                        }
                        text.append(g.items.joinToString(", "))
                        val b = BlockBuilder()
                        b.height = b.text(0f, 0f, layout(text, paint(type.body, ink), width, type.body))
                        b.build(sb)
                    }
                    SkillStyle.LIST -> {
                        val b = BlockBuilder()
                        var y = 0f
                        if (g.name.isNotBlank()) {
                            val role = type.entryTitle.copy(sizePt = type.entryTitle.sizePt * 0.92f)
                            y += b.text(0f, 0f, layout(g.name.trim(), paint(role, ink), width, role)) + 2f * d
                        }
                        val role = type.body.copy(sizePt = type.body.sizePt * 0.95f)
                        y += b.text(0f, y, layout(g.items.joinToString("\n"), paint(role, secondary), width, role))
                        b.height = y
                        b.build(sb)
                    }
                    SkillStyle.TAGS -> tagsBlock(g.name, g.items, width, sb)
                    SkillStyle.BULLETS -> bulletListBlock(g.name, g.items, width, sb)
                }
            }
        }

        /** Items as a bulleted list, split into two columns when the column is wide enough. */
        fun bulletListBlock(label: String, items: List<String>, width: Float, spaceBefore: Float): Block {
            val b = BlockBuilder()
            var y = 0f
            if (label.isNotBlank()) {
                val role = type.entryTitle.copy(sizePt = type.entryTitle.sizePt * 0.92f)
                y += b.text(0f, 0f, layout(label.trim(), paint(role, ink), width, role)) + 3f * d
            }
            val role = type.body.copy(sizePt = type.body.sizePt * 0.97f)
            val cols = if (width > 300f && items.size > 3) 2 else 1
            val colGap = 16f
            val colW = (width - (cols - 1) * colGap) / cols
            val hang = role.sizePt * 1.1f
            val glyph = paint(role.copy(tracking = 0f), accent)
            val perCol = (items.size + cols - 1) / cols
            var bottom = y
            items.chunked(perCol).forEachIndexed { c, column ->
                val x = c * (colW + colGap)
                var cy = y
                column.forEach { item ->
                    val l = layout(item, paint(role, ink), colW - hang, role)
                    b.add(x + hang, cy, TextOp(l))
                    b.add(x, cy, LabelOp(t.bulletGlyph, glyph, 0f, l.getLineBaseline(0).toFloat()))
                    cy += l.height + 4f * d
                }
                bottom = max(bottom, cy - 4f * d)
            }
            b.height = bottom
            return b.build(spaceBefore)
        }

        fun tagsBlock(label: String, items: List<String>, width: Float, spaceBefore: Float): Block {
            val b = BlockBuilder()
            var y = 0f
            if (label.isNotBlank()) {
                val role = type.meta.copy(caps = true, tracking = 0.08f)
                y += b.text(0f, 0f, layout(cased(label.trim(), role), paint(role, secondary), width, role)) + 3f * d
            }
            val p = paint(type.meta, ink)
            val fm = p.fontMetrics
            val padH = 6f
            val chipH = (fm.descent - fm.ascent) + 6f
            val gap = 4f
            var x = 0f
            for (item in items) {
                val cw = min(width, p.measureText(item) + 2 * padH)
                if (x > 0f && x + cw > width) {
                    x = 0f
                    y += chipH + gap
                }
                b.add(0f, 0f, RectOp(x, y, x + cw, y + chipH, rule, radius = chipH / 2, strokeWidth = 0.6f))
                b.add(0f, 0f, LabelOp(item, p, x + padH, y + 3f - fm.ascent))
                x += cw + gap
            }
            b.height = y + chipH
            return b.build(spaceBefore)
        }
    }
}
