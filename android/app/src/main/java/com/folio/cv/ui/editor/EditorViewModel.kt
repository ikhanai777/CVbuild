package com.folio.cv.ui.editor

import android.net.Uri
import android.os.SystemClock
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.folio.cv.AppContainer
import com.folio.cv.model.Resume
import com.folio.cv.render.LaidOutDocument
import com.folio.cv.template.Templates
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.mapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Holds the CV being edited. Every change lands in memory at once, is autosaved after 300 ms
 * of quiet, and is undoable. Typing in one field coalesces into a single undo step.
 */
@OptIn(FlowPreview::class, ExperimentalCoroutinesApi::class)
class EditorViewModel(private val c: AppContainer, val id: String) : ViewModel() {

    private val _resume = MutableStateFlow<Resume?>(null)
    val resume: StateFlow<Resume?> = _resume.asStateFlow()

    private val undoStack = ArrayDeque<Resume>()
    private val redoStack = ArrayDeque<Resume>()
    private val _canUndo = MutableStateFlow(false)
    private val _canRedo = MutableStateFlow(false)
    val canUndo: StateFlow<Boolean> = _canUndo.asStateFlow()
    val canRedo: StateFlow<Boolean> = _canRedo.asStateFlow()

    /** Bumps when undo or redo replaces the document, so text fields reload their contents. */
    private val _revision = MutableStateFlow(0)
    val revision: StateFlow<Int> = _revision.asStateFlow()

    private var saveJob: Job? = null
    private var lastKey: String? = null
    private var lastEditAt = 0L

    /** Live layout for the side-by-side preview on tablets and foldables. */
    val document: StateFlow<LaidOutDocument?> = _resume.filterNotNull()
        .debounce(60)
        .mapLatest { r -> withContext(Dispatchers.Default) { c.layout.layout(r, Templates.get(r.style.templateId)) } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    init {
        viewModelScope.launch { _resume.value = c.resumes.get(id) }
    }

    /**
     * Applies an edit. Pass a [key] (e.g. "header.name") for keystroke edits so a burst of typing
     * in one field becomes one undo step.
     */
    fun edit(key: String? = null, transform: (Resume) -> Resume) {
        val current = _resume.value ?: return
        val changed = transform(current)
        if (changed == current) return
        val now = SystemClock.uptimeMillis()
        if (key == null || key != lastKey || now - lastEditAt > 1_500) {
            undoStack.addLast(current)
            if (undoStack.size > 100) undoStack.removeFirst()
        }
        lastKey = key
        lastEditAt = now
        redoStack.clear()
        _resume.value = changed.copy(updatedAt = System.currentTimeMillis())
        refresh()
        scheduleSave()
    }

    fun undo() {
        val previous = undoStack.removeLastOrNull() ?: return
        _resume.value?.let { redoStack.addLast(it) }
        _resume.value = previous
        _revision.value++
        lastKey = null
        refresh()
        scheduleSave()
    }

    fun redo() {
        val next = redoStack.removeLastOrNull() ?: return
        _resume.value?.let { undoStack.addLast(it) }
        _resume.value = next
        _revision.value++
        lastKey = null
        refresh()
        scheduleSave()
    }

    /** Reloads text fields after a structural change (a bullet removed or moved) shifts positions. */
    fun bumpRevision() {
        _revision.value++
    }

    fun setPhoto(uri: Uri) {
        viewModelScope.launch {
            val old = _resume.value?.header?.photoPath
            val path = c.photos.import(uri, id) ?: return@launch
            edit { it.copy(header = it.header.copy(photoPath = path)) }
            if (old != null && old != path) c.photos.delete(old)
        }
    }

    fun removePhoto() {
        val old = _resume.value?.header?.photoPath ?: return
        edit { it.copy(header = it.header.copy(photoPath = null)) }
        c.photos.delete(old)
    }

    /** Persists immediately; used before leaving the editor. Runs on the app scope so it survives the ViewModel. */
    fun flush() {
        saveJob?.cancel()
        val r = _resume.value ?: return
        c.appScope.launch { c.resumes.save(r) }
    }

    private fun refresh() {
        _canUndo.value = undoStack.isNotEmpty()
        _canRedo.value = redoStack.isNotEmpty()
    }

    private fun scheduleSave() {
        saveJob?.cancel()
        saveJob = viewModelScope.launch {
            delay(300)
            _resume.value?.let { c.resumes.save(it) }
        }
    }

    override fun onCleared() {
        flush()
        super.onCleared()
    }
}
