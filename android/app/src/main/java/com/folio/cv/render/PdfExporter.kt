package com.folio.cv.render

import android.graphics.pdf.PdfDocument
import android.os.Bundle
import android.os.CancellationSignal
import android.os.ParcelFileDescriptor
import android.print.PageRange
import android.print.PrintAttributes
import android.print.PrintDocumentAdapter
import android.print.PrintDocumentInfo
import java.io.FileOutputStream
import java.io.OutputStream
import kotlin.math.roundToInt

/**
 * Writes a laid-out document as a vector PDF: real, selectable text with subset-embedded fonts.
 * It draws exactly what the preview draws.
 */
object PdfExporter {

    fun write(doc: LaidOutDocument, images: ImageCache, out: OutputStream) {
        val pdf = PdfDocument()
        try {
            doc.pages.indices.forEach { i ->
                val info = PdfDocument.PageInfo.Builder(doc.widthPt.roundToInt(), doc.heightPt.roundToInt(), i + 1).create()
                val page = pdf.startPage(info)
                doc.drawPage(page.canvas, i, images)
                pdf.finishPage(page)
            }
            pdf.writeTo(out)
        } finally {
            pdf.close()
        }
    }

    /** Suggested file name: "Firstname-Lastname-CV.pdf". */
    fun fileName(fullName: String, fallback: String): String {
        val base = fullName.ifBlank { fallback }.trim()
            .replace(Regex("[^\\p{L}\\p{N} ]"), "")
            .split(Regex("\\s+")).filter { it.isNotEmpty() }.joinToString("-")
        return "${base.ifEmpty { "CV" }}-CV.pdf"
    }
}

/** Hands the same PDF to Android's print framework. */
class CvPrintAdapter(
    private val doc: LaidOutDocument,
    private val images: ImageCache,
    private val jobName: String,
) : PrintDocumentAdapter() {

    override fun onLayout(
        oldAttributes: PrintAttributes?,
        newAttributes: PrintAttributes,
        cancellationSignal: CancellationSignal?,
        callback: LayoutResultCallback,
        extras: Bundle?,
    ) {
        if (cancellationSignal?.isCanceled == true) {
            callback.onLayoutCancelled()
            return
        }
        val info = PrintDocumentInfo.Builder(jobName)
            .setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT)
            .setPageCount(doc.pages.size)
            .build()
        callback.onLayoutFinished(info, oldAttributes != newAttributes)
    }

    override fun onWrite(
        pages: Array<out PageRange>?,
        destination: ParcelFileDescriptor,
        cancellationSignal: CancellationSignal?,
        callback: WriteResultCallback,
    ) {
        try {
            FileOutputStream(destination.fileDescriptor).use { PdfExporter.write(doc, images, it) }
            callback.onWriteFinished(arrayOf(PageRange.ALL_PAGES))
        } catch (e: Exception) {
            callback.onWriteFailed(e.message)
        }
    }
}
