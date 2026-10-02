package com.folio.cv.ui.templates

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.folio.cv.AppContainer
import com.folio.cv.model.Resume
import com.folio.cv.render.LaidOutDocument
import com.folio.cv.template.TemplateSpec
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

data class GalleryItem(val template: TemplateSpec, val document: LaidOutDocument)

data class GalleryState(val resume: Resume, val items: List<GalleryItem>)

/** Renders the user's own CV in every template, so they choose by seeing, not imagining. */
@OptIn(ExperimentalCoroutinesApi::class)
class TemplatesViewModel(private val c: AppContainer, val id: String) : ViewModel() {

    val state: StateFlow<GalleryState?> = c.resumes.observe(id).filterNotNull()
        .mapLatest { r ->
            withContext(Dispatchers.Default) {
                GalleryState(
                    r,
                    Templates.all.map { t ->
                        // Preview each template in its own default accent so the set reads as distinct.
                        val sample = r.copy(style = r.style.copy(templateId = t.id, accent = null))
                        GalleryItem(t, c.layout.layout(sample, t))
                    },
                )
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    val images get() = c.images

    fun apply(template: TemplateSpec, onDone: () -> Unit) {
        val r = state.value?.resume ?: return
        viewModelScope.launch {
            val accent = r.style.accent?.takeIf { it in template.accentOptions }
            c.resumes.save(
                r.copy(style = r.style.copy(templateId = template.id, accent = accent), updatedAt = System.currentTimeMillis()),
            )
            onDone()
        }
    }
}
