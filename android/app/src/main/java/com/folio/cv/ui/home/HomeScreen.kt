@file:OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)

package com.folio.cv.ui.home

import android.text.format.DateUtils
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.FileOpen
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.SnackbarResult
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.folio.cv.AppContainer
import com.folio.cv.model.Resume
import com.folio.cv.model.Starter
import com.folio.cv.template.Templates
import com.folio.cv.ui.components.EmptyState
import com.folio.cv.ui.components.FolioCard
import com.folio.cv.ui.components.FolioField
import com.folio.cv.ui.components.PageCanvas
import com.folio.cv.ui.components.QuietButton
import com.folio.cv.ui.components.SectionLabel
import com.folio.cv.ui.theme.Folio
import kotlinx.coroutines.launch

@Composable
fun HomeScreen(
    container: AppContainer,
    vm: HomeViewModel,
    openEditor: (String) -> Unit,
    openSettings: () -> Unit,
    startWithNewSheet: Boolean,
) {
    val items by vm.items.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var showNew by remember { mutableStateOf(startWithNewSheet) }
    var renaming by remember { mutableStateOf<Resume?>(null) }

    val importLauncher = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) {
            val text = runCatching { context.contentResolver.openInputStream(uri)?.use { it.readBytes().decodeToString() } }.getOrNull()
            if (text == null) {
                scope.launch { snackbar.showSnackbar("That file couldn't be read.") }
            } else {
                vm.import(text) { id ->
                    if (id != null) openEditor(id)
                    else scope.launch { snackbar.showSnackbar("That file isn't a Folio or JSON Resume file.") }
                }
            }
        }
    }

    Scaffold(
        containerColor = Folio.colors.background,
        snackbarHost = { SnackbarHost(snackbar) },
        floatingActionButton = {
            if (!items.isNullOrEmpty()) {
                ExtendedFloatingActionButton(
                    onClick = { showNew = true },
                    icon = { Icon(Icons.Outlined.Add, contentDescription = null) },
                    text = { Text("New CV") },
                    containerColor = Folio.colors.accent,
                    contentColor = androidx.compose.ui.graphics.Color.White,
                    shape = CircleShape,
                )
            }
        },
    ) { padding ->
        val list = items
        Column(Modifier.fillMaxSize().padding(padding)) {
            Row(
                Modifier.fillMaxWidth().padding(start = 20.dp, end = 8.dp, top = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("Folio", style = MaterialTheme.typography.displaySmall, color = Folio.colors.ink, modifier = Modifier.weight(1f))
                IconButton(onClick = openSettings) {
                    Icon(Icons.Outlined.Settings, contentDescription = "Settings", tint = Folio.colors.ink)
                }
            }
            when {
                list == null -> Unit
                list.isEmpty() -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    EmptyState(
                        title = "Your story starts here.",
                        body = "Create a CV in minutes. Folio handles the design.",
                        action = "Create your CV",
                        onAction = { showNew = true },
                    )
                }
                else -> LazyVerticalGrid(
                    columns = GridCells.Adaptive(160.dp),
                    contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 16.dp, bottom = 120.dp),
                    horizontalArrangement = Arrangement.spacedBy(20.dp),
                    verticalArrangement = Arrangement.spacedBy(28.dp),
                    modifier = Modifier.fillMaxSize(),
                ) {
                    item(span = { GridItemSpan(maxLineSpan) }) {
                        Text(
                            "${list.size} CV${if (list.size == 1) "" else "s"}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Folio.colors.secondary,
                        )
                    }
                    items(list, key = { it.resume.id }) { item ->
                        ResumeCard(
                            item = item,
                            container = container,
                            onOpen = { openEditor(item.resume.id) },
                            onDuplicate = { vm.duplicate(item.resume) },
                            onRename = { renaming = item.resume },
                            onDelete = {
                                vm.delete(item.resume)
                                scope.launch {
                                    val result = snackbar.showSnackbar("“${item.resume.name}” deleted", "Undo", duration = SnackbarDuration.Long)
                                    if (result == SnackbarResult.ActionPerformed) vm.undoDelete() else vm.commitDelete()
                                }
                            },
                            modifier = Modifier.animateItem(),
                        )
                    }
                }
            }
        }
    }

    if (showNew) {
        NewCvSheet(
            onDismiss = { showNew = false },
            onPick = { starter ->
                showNew = false
                vm.create(starter, openEditor)
            },
            onImport = {
                showNew = false
                importLauncher.launch(arrayOf("application/json", "text/plain", "application/octet-stream"))
            },
        )
    }

    renaming?.let { r ->
        var name by remember(r.id) { mutableStateOf(r.name) }
        AlertDialog(
            onDismissRequest = { renaming = null },
            title = { Text("Rename CV") },
            text = { FolioField(name, { name = it }, "Name") },
            confirmButton = {
                QuietButton("Rename", onClick = {
                    vm.rename(r, name)
                    renaming = null
                })
            },
            dismissButton = { QuietButton("Cancel", onClick = { renaming = null }, color = Folio.colors.secondary) },
        )
    }
}

@Composable
private fun ResumeCard(
    item: HomeItem,
    container: AppContainer,
    onOpen: () -> Unit,
    onDuplicate: () -> Unit,
    onRename: () -> Unit,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var menu by remember { mutableStateOf(false) }
    val haptics = LocalHapticFeedback.current
    Column(modifier) {
        Box {
            PageCanvas(
                document = item.thumbnail,
                pageIndex = 0,
                images = container.images,
                elevation = 6.dp,
                corner = 6.dp,
                modifier = Modifier
                    .fillMaxWidth()
                    .combinedClickable(
                        onClickLabel = "Edit",
                        onLongClickLabel = "More options",
                        onClick = onOpen,
                        onLongClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                            menu = true
                        },
                    ),
            )
            DropdownMenu(expanded = menu, onDismissRequest = { menu = false }) {
                DropdownMenuItem(text = { Text("Duplicate") }, onClick = { menu = false; onDuplicate() })
                DropdownMenuItem(text = { Text("Rename") }, onClick = { menu = false; onRename() })
                DropdownMenuItem(text = { Text("Delete", color = Folio.colors.destructive) }, onClick = { menu = false; onDelete() })
            }
        }
        Spacer(Modifier.height(12.dp))
        Text(item.resume.name, style = MaterialTheme.typography.titleSmall, color = Folio.colors.ink, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(
            "${Templates.get(item.resume.style.templateId).name}  ·  ${relative(item.resume.updatedAt)}",
            style = MaterialTheme.typography.bodySmall,
            color = Folio.colors.secondary,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

private fun relative(time: Long): String =
    DateUtils.getRelativeTimeSpanString(time, System.currentTimeMillis(), DateUtils.MINUTE_IN_MILLIS).toString()

@Composable
private fun NewCvSheet(onDismiss: () -> Unit, onPick: (Starter) -> Unit, onImport: () -> Unit) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Folio.colors.background,
    ) {
        Column(Modifier.padding(horizontal = 20.dp).navigationBarsPadding().padding(bottom = 16.dp)) {
            Text("New CV", style = MaterialTheme.typography.headlineSmall, color = Folio.colors.ink)
            Spacer(Modifier.height(4.dp))
            Text("Pick a start. You can change everything later.", style = MaterialTheme.typography.bodyMedium, color = Folio.colors.secondary)
            Spacer(Modifier.height(16.dp))
            SectionLabel("Start from")
            FolioCard {
                Column {
                    Starter.entries.forEachIndexed { i, starter ->
                        if (i > 0) HorizontalDivider(color = Folio.colors.separator, modifier = Modifier.padding(start = 16.dp))
                        SheetRow(starter.title, starter.subtitle) { onPick(starter) }
                    }
                }
            }
            Spacer(Modifier.height(16.dp))
            FolioCard {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Surface(onClick = onImport, color = androidx.compose.ui.graphics.Color.Transparent, modifier = Modifier.fillMaxWidth()) {
                        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.FileOpen, contentDescription = null, tint = Folio.colors.accent)
                            Spacer(Modifier.size(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text("Import a file", style = MaterialTheme.typography.titleSmall, color = Folio.colors.ink)
                                Text("Folio or JSON Resume (.json)", style = MaterialTheme.typography.bodySmall, color = Folio.colors.secondary)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SheetRow(title: String, subtitle: String, onClick: () -> Unit) {
    Surface(onClick = onClick, color = androidx.compose.ui.graphics.Color.Transparent, modifier = Modifier.fillMaxWidth()) {
        Row(Modifier.padding(horizontal = 16.dp, vertical = 14.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.titleSmall, color = Folio.colors.ink)
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = Folio.colors.secondary)
            }
            Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = Folio.colors.secondary)
        }
    }
}
