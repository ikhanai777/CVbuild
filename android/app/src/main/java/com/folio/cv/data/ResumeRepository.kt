package com.folio.cv.data

import com.folio.cv.model.Resume
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import java.io.File

/**
 * Single source of truth for CVs. Each CV is one JSON file in app-private storage, written
 * atomically (temp file, then rename) so a crash mid-write can never corrupt a CV.
 */
class ResumeRepository(
    private val dir: File,
    scope: CoroutineScope,
    private val io: CoroutineDispatcher = Dispatchers.IO,
) {
    private val state = MutableStateFlow<Map<String, Resume>>(emptyMap())
    private val loaded = CompletableDeferred<Unit>()
    private val writeLock = Mutex()

    val isLoaded: Flow<Boolean> = MutableStateFlow(false).also { flag ->
        scope.launch(io) {
            load()
            loaded.complete(Unit)
            flag.value = true
        }
    }

    /** All CVs, most recently edited first. */
    val resumes: Flow<List<Resume>> = state.map { m -> m.values.sortedByDescending { it.updatedAt } }

    fun observe(id: String): Flow<Resume?> = state.map { it[id] }.distinctUntilChanged()

    suspend fun get(id: String): Resume? {
        loaded.await()
        return state.value[id]
    }

    suspend fun save(resume: Resume) {
        loaded.await()
        state.update { it + (resume.id to resume) }
        write(resume)
    }

    suspend fun delete(id: String) {
        loaded.await()
        state.update { it - id }
        withContext(io) { writeLock.withLock { File(dir, "$id.json").delete() } }
    }

    private suspend fun load() = withContext(io) {
        dir.mkdirs()
        val files = dir.listFiles { f -> f.extension == "json" }.orEmpty()
        val loadedResumes = files.mapNotNull { f ->
            runCatching { json.decodeFromString(Resume.serializer(), f.readText()) }.getOrNull()
        }
        state.update { current -> loadedResumes.associateBy { it.id } + current }
    }

    private suspend fun write(resume: Resume) = withContext(io) {
        writeLock.withLock {
            dir.mkdirs()
            val target = File(dir, "${resume.id}.json")
            val tmp = File(dir, "${resume.id}.json.tmp")
            tmp.writeText(json.encodeToString(Resume.serializer(), resume))
            if (!tmp.renameTo(target)) {
                target.delete()
                tmp.renameTo(target)
            }
        }
    }

    companion object {
        val json = Json {
            ignoreUnknownKeys = true
            encodeDefaults = true
            coerceInputValues = true
        }
    }
}
