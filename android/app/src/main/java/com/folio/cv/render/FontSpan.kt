package com.folio.cv.render

import android.graphics.Typeface
import android.text.TextPaint
import android.text.style.MetricAffectingSpan

/** Switches typeface, size, colour or tracking for a run of text inside one StaticLayout. */
class FontSpan(
    private val typeface: Typeface,
    private val sizePt: Float? = null,
    private val color: Int? = null,
    private val tracking: Float? = null,
) : MetricAffectingSpan() {

    override fun updateDrawState(tp: TextPaint) {
        apply(tp)
        color?.let { tp.color = it }
    }

    override fun updateMeasureState(tp: TextPaint) = apply(tp)

    private fun apply(paint: TextPaint) {
        paint.typeface = typeface
        sizePt?.let { paint.textSize = it }
        tracking?.let { paint.letterSpacing = it }
    }
}
