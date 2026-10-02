package com.folio.cv.render

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.DashPathEffect
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Rect
import android.graphics.RectF
import android.text.Layout
import android.text.TextPaint
import android.util.LruCache
import com.folio.cv.model.ContactKind
import com.folio.cv.template.PhotoShape
import kotlin.math.min

/** A drawing instruction in page points, relative to the origin it is placed at. */
sealed interface DrawOp {
    fun draw(canvas: Canvas, images: ImageCache)
}

class TextOp(val layout: Layout) : DrawOp {
    override fun draw(canvas: Canvas, images: ImageCache) = layout.draw(canvas)
}

/** A single line of text drawn at a baseline; used for small labels and chips. */
class LabelOp(val text: String, val paint: TextPaint, val x: Float, val baseline: Float) : DrawOp {
    override fun draw(canvas: Canvas, images: ImageCache) = canvas.drawText(text, x, baseline, paint)
}

class RectOp(
    val left: Float, val top: Float, val right: Float, val bottom: Float,
    color: Int, val radius: Float = 0f, strokeWidth: Float = 0f,
) : DrawOp {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color
        if (strokeWidth > 0f) {
            style = Paint.Style.STROKE
            this.strokeWidth = strokeWidth
        }
    }

    override fun draw(canvas: Canvas, images: ImageCache) {
        if (radius > 0f) canvas.drawRoundRect(left, top, right, bottom, radius, radius, paint)
        else canvas.drawRect(left, top, right, bottom, paint)
    }
}

class LineOp(
    val x1: Float, val y1: Float, val x2: Float, val y2: Float,
    color: Int, width: Float, dashed: Boolean = false,
) : DrawOp {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color
        strokeWidth = width
        style = Paint.Style.STROKE
        if (dashed) pathEffect = DashPathEffect(floatArrayOf(2.5f, 2f), 0f)
    }

    override fun draw(canvas: Canvas, images: ImageCache) = canvas.drawLine(x1, y1, x2, y2, paint)
}

class CircleOp(val cx: Float, val cy: Float, val r: Float, color: Int, strokeWidth: Float = 0f) : DrawOp {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color
        if (strokeWidth > 0f) {
            style = Paint.Style.STROKE
            this.strokeWidth = strokeWidth
        }
    }
    override fun draw(canvas: Canvas, images: ImageCache) = canvas.drawCircle(cx, cy, r, paint)
}

/** A centre-cropped photo clipped to the template's shape. */
class PhotoOp(val path: String, val left: Float, val top: Float, val size: Float, val shape: PhotoShape) : DrawOp {
    override fun draw(canvas: Canvas, images: ImageCache) {
        val bitmap = images.get(path) ?: return
        val side = min(bitmap.width, bitmap.height)
        val src = Rect((bitmap.width - side) / 2, (bitmap.height - side) / 2, (bitmap.width + side) / 2, (bitmap.height + side) / 2)
        val dst = RectF(left, top, left + size, top + size)
        val clip = Path().apply {
            if (shape == PhotoShape.CIRCLE) addOval(dst, Path.Direction.CW)
            else addRoundRect(dst, size * 0.12f, size * 0.12f, Path.Direction.CW)
        }
        canvas.save()
        canvas.clipPath(clip)
        canvas.drawBitmap(bitmap, src, dst, Paint(Paint.FILTER_BITMAP_FLAG or Paint.ANTI_ALIAS_FLAG))
        canvas.restore()
    }
}

/** A small line icon for a contact item, drawn as vector paths so it stays sharp in the PDF. */
class IconOp(val kind: ContactKind, val x: Float, val y: Float, val size: Float, color: Int) : DrawOp {
    private val stroke = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color
        style = Paint.Style.STROKE
        strokeWidth = size * 0.1f
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
    }
    private val fill = Paint(Paint.ANTI_ALIAS_FLAG).apply { this.color = color }

    override fun draw(canvas: Canvas, images: ImageCache) {
        val s = size
        canvas.save()
        canvas.translate(x, y)
        when (kind) {
            ContactKind.EMAIL -> {
                canvas.drawRoundRect(0.05f * s, 0.2f * s, 0.95f * s, 0.8f * s, 0.08f * s, 0.08f * s, stroke)
                val v = Path().apply {
                    moveTo(0.1f * s, 0.27f * s); lineTo(0.5f * s, 0.55f * s); lineTo(0.9f * s, 0.27f * s)
                }
                canvas.drawPath(v, stroke)
            }
            ContactKind.PHONE -> {
                canvas.drawRoundRect(0.25f * s, 0.04f * s, 0.75f * s, 0.96f * s, 0.12f * s, 0.12f * s, stroke)
                canvas.drawCircle(0.5f * s, 0.8f * s, 0.055f * s, fill)
            }
            ContactKind.LOCATION -> {
                val pin = Path().apply {
                    moveTo(0.5f * s, 0.96f * s)
                    cubicTo(0.2f * s, 0.62f * s, 0.14f * s, 0.48f * s, 0.14f * s, 0.38f * s)
                    cubicTo(0.14f * s, 0.16f * s, 0.3f * s, 0.03f * s, 0.5f * s, 0.03f * s)
                    cubicTo(0.7f * s, 0.03f * s, 0.86f * s, 0.16f * s, 0.86f * s, 0.38f * s)
                    cubicTo(0.86f * s, 0.48f * s, 0.8f * s, 0.62f * s, 0.5f * s, 0.96f * s)
                    close()
                }
                canvas.drawPath(pin, stroke)
                canvas.drawCircle(0.5f * s, 0.38f * s, 0.12f * s, stroke)
            }
            ContactKind.WEBSITE -> {
                canvas.drawCircle(0.5f * s, 0.5f * s, 0.43f * s, stroke)
                canvas.drawOval(0.3f * s, 0.07f * s, 0.7f * s, 0.93f * s, stroke)
                canvas.drawLine(0.07f * s, 0.5f * s, 0.93f * s, 0.5f * s, stroke)
            }
            ContactKind.LINKEDIN, ContactKind.GITHUB -> {
                canvas.drawRoundRect(0.06f * s, 0.06f * s, 0.94f * s, 0.94f * s, 0.16f * s, 0.16f * s, stroke)
                val label = if (kind == ContactKind.LINKEDIN) "in" else "gh"
                val tp = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
                    color = fill.color
                    textSize = s * 0.5f
                    isFakeBoldText = true
                    textAlign = Paint.Align.CENTER
                }
                canvas.drawText(label, 0.5f * s, 0.68f * s, tp)
            }
        }
        canvas.restore()
    }
}

/** An op placed at an absolute page position. */
class Placed(val x: Float, val y: Float, val op: DrawOp)

class ImageCache {
    private val cache = object : LruCache<String, Bitmap>(8 * 1024 * 1024) {
        override fun sizeOf(key: String, value: Bitmap) = value.byteCount
    }

    fun get(path: String): Bitmap? {
        cache.get(path)?.let { return it }
        val bitmap = runCatching { BitmapFactory.decodeFile(path) }.getOrNull() ?: return null
        cache.put(path, bitmap)
        return bitmap
    }
}
