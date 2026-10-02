package com.folio.cv.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.folio.cv.AppContainer
import com.folio.cv.data.Portability
import com.folio.cv.model.PageSize
import com.folio.cv.model.Resume
import com.folio.cv.model.Starter
import com.folio.cv.model.Starters
import com.folio.cv.model.duplicate
import com.folio.cv.render.LaidOutDocument
import com.folio.cv.template.Templates
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.mapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.Locale

data class HomeItem(val resume: Resume, val thumbnail: LaidOutDocument)

@OptIn(ExperimentalCoroutinesApi::class)
class HomeViewModel(private val c: AppContainer) : ViewModel() {

    private val layoutCache = HashMap<String, Pair<Resume, LaidOutDocument>>()

    /** Null until storage has loaded, so the first frame never flashes the empty state. */
    val items: StateFlow<List<HomeItem>?> = c.resumes.resumes
        .mapLatest { list ->
            withContext(Dispatchers.Default) {
                list.map { r ->
                    val cached = layoutCache[r.id]
                    val doc = if (cached != null && cached.first == r) cached.second
                    else c.layout.layout(r, Templates.get(r.style.templateId)).also { layoutCache[r.id] = r to it }
                    HomeItem(r, doc)
                }
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    private var recentlyDeleted: Resume? = null

    fun create(starter: Starter, onCreated: (String) -> Unit) {
        val pageSize = if (Locale.getDefault().country in setOf("US", "CA", "MX", "PH")) PageSize.LETTER else PageSize.A4
        val resume = Starters.create(starter, System.currentTimeMillis(), pageSize)
        viewModelScope.launch {
            c.resumes.save(resume)
            onCreated(resume.id)
        }
    }

    fun duplicate(resume: Resume) {
        viewModelScope.launch { c.resumes.save(resume.duplicate(System.currentTimeMillis())) }
    }

    fun rename(resume: Resume, name: String) {
        if (name.isBlank()) return
        viewModelScope.launch { c.resumes.save(resume.copy(name = name.trim(), updatedAt = System.currentTimeMillis())) }
    }

    fun delete(resume: Resume) {
        recentlyDeleted = resume
        viewModelScope.launch { c.resumes.delete(resume.id) }
    }

    fun undoDelete() {
        val r = recentlyDeleted ?: return
        recentlyDeleted = null
        viewModelScope.launch { c.resumes.save(r) }
    }

    /** Called once the undo window has passed: now it's safe to remove the photo file too. */
    fun commitDelete() {
        recentlyDeleted?.let { c.photos.delete(it.header.photoPath) }
        recentlyDeleted = null
    }

    fun import(text: String, onResult: (String?) -> Unit) {
        viewModelScope.launch {
            val resume = withContext(Dispatchers.Default) { Portability.import(text, System.currentTimeMillis()) }
            if (resume != null) c.resumes.save(resume)
            onResult(resume?.id)
        }
    }
}
