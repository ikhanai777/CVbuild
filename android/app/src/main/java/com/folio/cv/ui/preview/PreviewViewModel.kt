package com.folio.cv.ui.preview

import android.content.Context
import android.net.Uri
import androidx.core.content.FileProvider
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.folio.cv.AppContainer
import com.folio.cv.analysis.CheckReport
import com.folio.cv.analysis.CvChecker
import com.folio.cv.data.Portability
import com.folio.cv.model.Resume
import com.folio.cv.model.StyleSettings
import com.folio.cv.render.LaidOutDocument
import com.folio.cv.render.PdfExporter
import com.folio.cv.template.Templates
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.mapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

data class PreviewState(val resume: Resume, val document: LaidOutDocument, val report: CheckReport)

@OptIn(ExperimentalCoroutinesApi::class)
class PreviewViewModel(private val c: AppContainer, val id: String) : ViewModel() {

    val state: StateFlow<PreviewState?> = c.resumes.observe(id).filterNotNull()
        .mapLatest { r ->
            withContext(Dispatchers.Default) {
                val template = Templates.get(r.style.templateId)
                PreviewState(r, c.layout.layout(r, template), CvChecker.check(r, template))
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    val images get() = c.images

    fun updateStyle(transform: (StyleSettings) -> StyleSettings) {
        val r = state.value?.resume ?: return
        viewModelScope.launch {
            c.resumes.save(r.copy(style = transform(r.style), updatedAt = System.currentTimeMillis()))
        }
    }

    /** Writes the PDF to the cache and returns a shareable content:// URI. */
    fun pdfForSharing(context: Context, fileName: String, onReady: (Uri?) -> Unit) {
        val s = state.value ?: return onReady(null)
        viewModelScope.launch {
            val uri = withContext(Dispatchers.IO) {
                runCatching {
                    val dir = File(context.cacheDir, "exports").apply { mkdirs() }
                    dir.listFiles()?.forEach { it.delete() }
                    val file = File(dir, fileName)
                    file.outputStream().use { PdfExporter.write(s.document, c.images, it) }
                    FileProvider.getUriForFile(context, "${context.packageName}.files", file)
                }.getOrNull()
            }
            onReady(uri)
        }
    }

    fun savePdf(context: Context, target: Uri, onDone: (Boolean) -> Unit) {
        val s = state.value ?: return onDone(false)
        viewModelScope.launch {
            val ok = withContext(Dispatchers.IO) {
                runCatching {
                    context.contentResolver.openOutputStream(target)?.use { PdfExporter.write(s.document, c.images, it) } != null
                }.getOrDefault(false)
            }
            onDone(ok)
        }
    }

    fun saveJson(context: Context, target: Uri, onDone: (Boolean) -> Unit) {
        val s = state.value ?: return onDone(false)
        viewModelScope.launch {
            val ok = withContext(Dispatchers.IO) {
                runCatching {
                    context.contentResolver.openOutputStream(target)?.use { it.write(Portability.export(s.resume).toByteArray()) } != null
                }.getOrDefault(false)
            }
            onDone(ok)
        }
    }
}
