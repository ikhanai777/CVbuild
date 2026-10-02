@file:OptIn(ExperimentalMaterial3Api::class)

package com.folio.cv.ui.editor

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.Redo
import androidx.compose.material.icons.automirrored.outlined.Undo
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.folio.cv.AppContainer
import com.folio.cv.model.Resume
import com.folio.cv.ui.components.PageCanvas
import com.folio.cv.ui.components.PillButton
import com.folio.cv.ui.theme.Folio

/** Where the editor is: the outline, the header form, one section, or one entry. */
sealed interface Pane {
    val depth: Int

    data object Outline : Pane { override val depth = 0 }
    data object Header : Pane { override val depth = 1 }
    data class SectionPane(val sectionId: String) : Pane { override val depth = 1 }
    data class EntryPane(val sectionId: String, val entryId: String) : Pane { override val depth = 2 }

    fun encode(): String = when (this) {
        Outline -> "o"
        Header -> "h"
        is SectionPane -> "s:$sectionId"
        is EntryPane -> "e:$sectionId:$entryId"
    }

    fun parent(): Pane = when (this) {
        is EntryPane -> SectionPane(sectionId)
        else -> Outline
    }

    companion object {
        fun decode(s: String): Pane {
            val p = s.split(":")
            return when (p[0]) {
                "h" -> Header
                "s" -> SectionPane(p[1])
                "e" -> EntryPane(p[1], p[2])
                else -> Outline
            }
        }
    }
}

@Composable
fun EditorScreen(
    container: AppContainer,
    vm: EditorViewModel,
    onBack: () -> Unit,
    openPreview: () -> Unit,
    openTemplates: () -> Unit,
) {
    val resume by vm.resume.collectAsStateWithLifecycle()
    val canUndo by vm.canUndo.collectAsStateWithLifecycle()
    val canRedo by vm.canRedo.collectAsStateWithLifecycle()
    val revision by vm.revision.collectAsStateWithLifecycle()
    var paneCode by rememberSaveable { mutableStateOf("o") }
    val pane = Pane.decode(paneCode)
    val r = resume

    fun go(p: Pane) {
        paneCode = p.encode()
    }

    fun back() {
        if (pane == Pane.Outline) {
            vm.flush()
            onBack()
        } else go(pane.parent())
    }

    BackHandler { back() }

    Scaffold(
        containerColor = Folio.colors.background,
        topBar = {
            CenterAlignedTopAppBar(
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(containerColor = Folio.colors.background),
                title = {
                    Text(
                        r?.let { title(it, pane) }.orEmpty(),
                        style = MaterialTheme.typography.titleMedium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                },
                navigationIcon = {
                    IconButton(onClick = { back() }) {
                        Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = vm::undo, enabled = canUndo) {
                        Icon(Icons.AutoMirrored.Outlined.Undo, contentDescription = "Undo")
                    }
                    IconButton(onClick = vm::redo, enabled = canRedo) {
                        Icon(Icons.AutoMirrored.Outlined.Redo, contentDescription = "Redo")
                    }
                },
            )
        },
    ) { padding ->
        if (r == null) return@Scaffold
        BoxWithConstraints(Modifier.fillMaxSize().padding(padding)) {
            val wide = maxWidth >= 840.dp
            Row(Modifier.fillMaxSize()) {
                Box(Modifier.weight(1f).fillMaxHeight()) {
                    AnimatedContent(
                        targetState = paneCode,
                        transitionSpec = {
                            val forward = Pane.decode(targetState).depth >= Pane.decode(initialState).depth
                            val dir = if (forward) 1 else -1
                            (slideInHorizontally(spring(dampingRatio = 0.85f, stiffness = 400f)) { it * dir / 4 } + fadeIn()) togetherWith
                                (slideOutHorizontally(spring(dampingRatio = 0.85f, stiffness = 400f)) { -it * dir / 4 } + fadeOut())
                        },
                        label = "editor-pane",
                    ) { code ->
                        val target = Pane.decode(code)
                        val current = resume ?: return@AnimatedContent
                        when (target) {
                            Pane.Outline -> OutlinePane(
                                resume = current,
                                vm = vm,
                                openHeader = { go(Pane.Header) },
                                openSection = { go(Pane.SectionPane(it)) },
                                openTemplates = openTemplates,
                            )
                            Pane.Header -> HeaderPane(current, vm, revision)
                            is Pane.SectionPane -> {
                                val section = current.sections.firstOrNull { it.id == target.sectionId }
                                if (section == null) {
                                    LaunchedEffect(code) { go(Pane.Outline) }
                                } else {
                                    SectionPane(
                                        section = section,
                                        vm = vm,
                                        revision = revision,
                                        openEntry = { go(Pane.EntryPane(section.id, it)) },
                                        onDeleted = { go(Pane.Outline) },
                                    )
                                }
                            }
                            is Pane.EntryPane -> {
                                val section = current.sections.firstOrNull { it.id == target.sectionId }
                                val entry = section?.entries?.firstOrNull { it.id == target.entryId }
                                if (section == null || entry == null) {
                                    LaunchedEffect(code) { go(target.parent()) }
                                } else {
                                    EntryPane(section, entry, vm, revision, onDeleted = { go(target.parent()) })
                                }
                            }
                        }
                    }
                    if (pane == Pane.Outline && !wide) {
                        PillButton(
                            text = "Preview & export",
                            icon = Icons.Outlined.Visibility,
                            onClick = {
                                vm.flush()
                                openPreview()
                            },
                            modifier = Modifier
                                .align(Alignment.BottomCenter)
                                .navigationBarsPadding()
                                .padding(bottom = 16.dp),
                        )
                    }
                }
                if (wide) {
                    LivePreview(container, vm, openPreview, Modifier.weight(1f).fillMaxHeight())
                }
            }
        }
    }
}

private fun title(r: Resume, pane: Pane): String = when (pane) {
    Pane.Outline -> r.name
    Pane.Header -> "Personal details"
    is Pane.SectionPane -> r.sections.firstOrNull { it.id == pane.sectionId }?.title ?: ""
    is Pane.EntryPane -> r.sections.firstOrNull { it.id == pane.sectionId }?.entries
        ?.firstOrNull { it.id == pane.entryId }?.title?.ifBlank { "New entry" } ?: ""
}

@Composable
private fun LivePreview(container: AppContainer, vm: EditorViewModel, openPreview: () -> Unit, modifier: Modifier) {
    val doc by vm.document.collectAsStateWithLifecycle()
    Box(modifier.background(Folio.colors.canvas)) {
        val d = doc
        if (d != null) {
            LazyColumn(
                contentPadding = PaddingValues(32.dp),
                verticalArrangement = Arrangement.spacedBy(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxSize(),
            ) {
                itemsIndexed(d.pages) { index, _ ->
                    PageCanvas(d, index, container.images, Modifier.widthIn(max = 560.dp).fillMaxWidth(), elevation = 8.dp)
                }
            }
        }
        PillButton(
            text = "Export",
            onClick = {
                vm.flush()
                openPreview()
            },
            modifier = Modifier.align(Alignment.BottomCenter).navigationBarsPadding().padding(bottom = 16.dp),
        )
    }
}
