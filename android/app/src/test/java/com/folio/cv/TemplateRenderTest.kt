package com.folio.cv

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import androidx.test.core.app.ApplicationProvider
import com.folio.cv.model.Starter
import com.folio.cv.model.Starters
import com.folio.cv.render.DocumentLayout
import com.folio.cv.render.FontRegistry
import com.folio.cv.render.ImageCache
import com.folio.cv.template.PhotoShape
import com.folio.cv.template.TemplateCategory
import com.folio.cv.template.Templates
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File

/**
 * Lays out and draws every template with real fonts, and writes PNG previews to
 * build/previews so CI can publish them for visual review.
 */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [34])
class TemplateRenderTest {

    private val context = ApplicationProvider.getApplicationContext<android.app.Application>()
    private val layout = DocumentLayout(FontRegistry(context))
    private val out = File("build/previews").apply { mkdirs() }

    @Test
    fun rendersEveryTemplate() {
        Templates.all.forEach { t ->
            val starter = when {
                t.category == TemplateCategory.ENGINEERING -> Starter.MECHANICAL
                else -> Starter.PROFESSIONAL
            }
            val resume = Starters.create(starter, 0L).let {
                val photo = if (t.photo != PhotoShape.NONE) avatar.absolutePath else null
                it.copy(style = it.style.copy(templateId = t.id), header = it.header.copy(photoPath = photo))
            }
            val doc = layout.layout(resume, t)
            assertTrue("${t.id} produced no pages", doc.pages.isNotEmpty())
            assertTrue("${t.id} page 1 is empty", doc.pages[0].ops.size > 10)
            doc.pages.indices.forEach { i -> write(doc, i, "${t.id}-p${i + 1}") }
        }
        // The graduate sample in its own template too.
        val grad = Starters.create(Starter.MECHANICAL_GRADUATE, 0L)
        val gradDoc = layout.layout(grad, Templates.get(grad.style.templateId))
        write(gradDoc, 0, "graduate-${grad.style.templateId}-p1")
    }

    /** A neutral silhouette standing in for a portrait, so photo templates preview as designed. */
    private val avatar: File by lazy {
        val size = 400
        val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val c = Canvas(bitmap)
        c.drawColor(Color.rgb(222, 219, 214))
        val p = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.rgb(176, 170, 162) }
        c.drawCircle(size / 2f, size * 0.4f, size * 0.17f, p)
        c.drawOval(RectF(size * 0.16f, size * 0.64f, size * 0.84f, size * 1.25f), p)
        File(out, "avatar.png").also { f -> f.outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) } }
    }

    private fun write(doc: com.folio.cv.render.LaidOutDocument, page: Int, name: String) {
        val scale = 2f
        val bitmap = Bitmap.createBitmap((doc.widthPt * scale).toInt(), (doc.heightPt * scale).toInt(), Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.scale(scale, scale)
        doc.drawPage(canvas, page, ImageCache())
        File(out, "$name.png").outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
    }
}
