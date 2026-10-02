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

class CircleOp(val cx: Float, val cy: Float, val r: Float, color: Int) : DrawOp {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { this.color = color }
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
