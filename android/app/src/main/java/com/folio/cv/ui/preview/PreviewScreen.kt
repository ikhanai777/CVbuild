@file:OptIn(ExperimentalMaterial3Api::class)

package com.folio.cv.ui.preview

import android.content.Intent
import android.print.PrintManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.DataObject
import androidx.compose.material.icons.outlined.Download
import androidx.compose.material.icons.outlined.ErrorOutline
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.IosShare
import androidx.compose.material.icons.outlined.Palette
import androidx.compose.material.icons.outlined.Print
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.folio.cv.analysis.CheckItem
import com.folio.cv.analysis.CheckLevel
import com.folio.cv.analysis.CheckReport
import com.folio.cv.model.DateFormat
import com.folio.cv.model.Density
import com.folio.cv.model.PageSize
import com.folio.cv.model.StyleSettings
import com.folio.cv.render.CvPrintAdapter
import com.folio.cv.render.PdfExporter
import com.folio.cv.template.PhotoShape
import com.folio.cv.template.TemplateSpec
import com.folio.cv.template.Templates
import com.folio.cv.ui.components.FolioCard
import com.folio.cv.ui.components.FolioField
import com.folio.cv.ui.components.PageCanvas
import com.folio.cv.ui.components.PillButton
import com.folio.cv.ui.components.SectionLabel
import com.folio.cv.ui.components.Swatch
import com.folio.cv.ui.theme.Folio
import kotlinx.coroutines.launch

private enum class Sheet { NONE, STYLE, CHECK, EXPORT }

@Composable
fun PreviewScreen(vm: PreviewViewModel, onBack: () -> Unit, openTemplates: () -> Unit) {
    val state by vm.state.collectAsStateWithLifecycle()
    var sheet by remember { mutableStateOf(Sheet.NONE) }
    var zoomed by remember { mutableStateOf(false) }
    val zoom by animateFloatAsState(if (zoomed) 1.8f else 1f, spring(dampingRatio = 0.85f, stiffness = 300f), label = "zoom")
    val snackbar = remember { SnackbarHostState() }

    Scaffold(
        containerColor = Folio.colors.canvas,
        snackbarHost = { SnackbarHost(snackbar) },
        topBar = {
            CenterAlignedTopAppBar(
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(containerColor = Folio.colors.canvas),
                title = { Text(state?.resume?.name.orEmpty(), style = MaterialTheme.typography.titleMedium, maxLines = 1) },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back to editor") }
                },
                actions = {
                    IconButton(onClick = { sheet = Sheet.STYLE }) { Icon(Icons.Outlined.Palette, contentDescription = "Style") }
                },
            )
        },
    ) { padding ->
        val s = state ?: return@Scaffold
        Box(Modifier.fillMaxSize().padding(padding)) {
            BoxWithConstraints(Modifier.fillMaxSize()) {
                val pageWidth = (maxWidth - 48.dp).coerceAtMost(620.dp) * zoom
                LazyColumn(
                    contentPadding = PaddingValues(top = 8.dp, bottom = 120.dp),
                    verticalArrangement = Arrangement.spacedBy(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.fillMaxSize(),
                ) {
                    item {
                        ScoreBanner(s.report) { sheet = Sheet.CHECK }
                    }
                    itemsIndexed(s.document.pages) { index, _ ->
                        val scroll = rememberScrollState()
                        Box(Modifier.fillMaxWidth().horizontalScroll(scroll, enabled = zoomed), contentAlignment = Alignment.Center) {
                            PageCanvas(
                                document = s.document,
                                pageIndex = index,
                                images = vm.images,
                                elevation = 8.dp,
                                modifier = Modifier
                                    .padding(horizontal = 24.dp)
                                    .width(pageWidth)
                                    .pointerInput(Unit) { detectTapGestures(onDoubleTap = { zoomed = !zoomed }) },
                            )
                        }
                    }
                    item {
                        Text(
                            "${s.document.pages.size} page${if (s.document.pages.size == 1) "" else "s"}  ·  ${s.resume.style.pageSize.label}  ·  double-tap to zoom",
                            style = MaterialTheme.typography.bodySmall,
                            color = Folio.colors.secondary,
                        )
                    }
                }
            }
            PillButton(
                text = "Export",
                icon = Icons.Outlined.IosShare,
                onClick = { sheet = Sheet.EXPORT },
                modifier = Modifier.align(Alignment.BottomCenter).navigationBarsPadding().padding(bottom = 16.dp),
            )
        }

        val template = Templates.get(s.resume.style.templateId)
        when (sheet) {
            Sheet.STYLE -> StyleSheet(
                template = template,
                style = s.resume.style,
                hasPhoto = s.resume.header.photoPath != null,
                onChange = vm::updateStyle,
                openTemplates = {
                    sheet = Sheet.NONE
                    openTemplates()
                },
                onDismiss = { sheet = Sheet.NONE },
            )
            Sheet.CHECK -> CheckSheet(s.report) { sheet = Sheet.NONE }
            Sheet.EXPORT -> ExportSheet(vm, s.resume.header.fullName, s.resume.name, s.report, snackbar) { sheet = Sheet.NONE }
            Sheet.NONE -> Unit
        }
    }
}

@Composable
private fun ScoreBanner(report: CheckReport, onClick: () -> Unit) {
    val good = report.problems.isEmpty()
    Surface(
        onClick = onClick,
        shape = MaterialTheme.shapes.extraLarge,
        color = Folio.colors.background,
        modifier = Modifier.padding(horizontal = 24.dp),
    ) {
        Row(Modifier.padding(horizontal = 16.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(
                if (good) Icons.Outlined.CheckCircle else Icons.Outlined.ErrorOutline,
                contentDescription = null,
                tint = if (good) Color(0xFF248A3D) else Folio.colors.destructive,
                modifier = Modifier.size(18.dp),
            )
            Spacer(Modifier.width(8.dp))
            val fixes = report.problems.size + report.advice.size
            Text(
                "CV check ${report.score}/100" + if (fixes > 0) "  ·  $fixes suggestion${if (fixes == 1) "" else "s"}" else "  ·  ready to send",
                style = MaterialTheme.typography.labelMedium,
                color = Folio.colors.ink,
            )
        }
    }
}

@Composable
private fun FolioSheet(onDismiss: () -> Unit, content: @Composable () -> Unit) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Folio.colors.background,
    ) {
        Column(
            Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp)
                .navigationBarsPadding()
                .padding(bottom = 20.dp),
        ) { content() }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun StyleSheet(
    template: TemplateSpec,
    style: StyleSettings,
    hasPhoto: Boolean,
    onChange: ((StyleSettings) -> StyleSettings) -> Unit,
    openTemplates: () -> Unit,
    onDismiss: () -> Unit,
) {
    FolioSheet(onDismiss) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text("Style", style = MaterialTheme.typography.headlineSmall, color = Folio.colors.ink)
                Text(template.name, style = MaterialTheme.typography.bodyMedium, color = Folio.colors.secondary)
            }
            Text(
                "Change template",
                style = MaterialTheme.typography.labelLarge,
                color = Folio.colors.accent,
                modifier = Modifier.pointerInput(Unit) { detectTapGestures { openTemplates() } }.padding(8.dp),
            )
        }
        SectionLabel("Accent")
        val current = style.accent ?: template.palette.accent
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            template.accentOptions.forEachIndexed { i, argb ->
                Swatch(Color(argb), argb == current, onClick = { onChange { it.copy(accent = argb) } }, label = "Accent ${i + 1}")
            }
        }
        SectionLabel("Density")
        Segmented(Density.entries.map { it.label }, Density.entries.indexOf(style.density)) { i ->
            onChange { it.copy(density = Density.entries[i]) }
        }
        SectionLabel("Page size")
        Segmented(PageSize.entries.map { it.label }, PageSize.entries.indexOf(style.pageSize)) { i ->
            onChange { it.copy(pageSize = PageSize.entries[i]) }
        }
        SectionLabel("Dates")
        Segmented(DateFormat.entries.map { it.label }, DateFormat.entries.indexOf(style.dateFormat)) { i ->
            onChange { it.copy(dateFormat = DateFormat.entries[i]) }
        }
        if (hasPhoto && template.photo != PhotoShape.NONE) {
            Spacer(Modifier.height(16.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Show photo", style = MaterialTheme.typography.bodyLarge, color = Folio.colors.ink, modifier = Modifier.weight(1f))
                Switch(
                    checked = style.showPhoto,
                    onCheckedChange = { on -> onChange { it.copy(showPhoto = on) } },
                    colors = SwitchDefaults.colors(checkedTrackColor = Folio.colors.accent),
                )
            }
        }
    }
}

@Composable
private fun Segmented(options: List<String>, selected: Int, onSelect: (Int) -> Unit) {
    SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
        options.forEachIndexed { i, label ->
            SegmentedButton(
                selected = i == selected,
                onClick = { onSelect(i) },
                shape = SegmentedButtonDefaults.itemShape(index = i, count = options.size),
                colors = SegmentedButtonDefaults.colors(
                    activeContainerColor = Folio.colors.ink,
                    activeContentColor = Folio.colors.background,
                    inactiveContainerColor = Color.Transparent,
                    inactiveContentColor = Folio.colors.ink,
                    activeBorderColor = Folio.colors.ink,
                    inactiveBorderColor = Folio.colors.separator,
                ),
                icon = {},
            ) { Text(label, style = MaterialTheme.typography.labelMedium) }
        }
    }
}

@Composable
private fun CheckSheet(report: CheckReport, onDismiss: () -> Unit) {
    FolioSheet(onDismiss) {
        Text("CV check", style = MaterialTheme.typography.headlineSmall, color = Folio.colors.ink)
        Text(
            "How a recruiter and an applicant tracking system will read this CV.",
            style = MaterialTheme.typography.bodyMedium,
            color = Folio.colors.secondary,
        )
        Spacer(Modifier.height(12.dp))
        Text("${report.score}", style = MaterialTheme.typography.displaySmall, color = Folio.colors.ink)
        Text("out of 100", style = MaterialTheme.typography.bodySmall, color = Folio.colors.secondary)
        if (report.problems.isNotEmpty()) {
            SectionLabel("Fix")
            CheckList(report.problems)
        }
        if (report.advice.isNotEmpty()) {
            SectionLabel("Consider")
            CheckList(report.advice)
        }
        if (report.passes.isNotEmpty()) {
            SectionLabel("Looks good")
            CheckList(report.passes)
        }
    }
}

@Composable
private fun CheckList(items: List<CheckItem>) {
    FolioCard(Modifier.fillMaxWidth()) {
        Column {
            items.forEachIndexed { i, item ->
                if (i > 0) HorizontalDivider(color = Folio.colors.separator, modifier = Modifier.padding(start = 44.dp))
                Row(Modifier.padding(14.dp), verticalAlignment = Alignment.Top) {
                    val (icon, tint) = when (item.level) {
                        CheckLevel.PROBLEM -> Icons.Outlined.ErrorOutline to Folio.colors.destructive
                        CheckLevel.ADVICE -> Icons.Outlined.Info to Folio.colors.accent
                        CheckLevel.PASS -> Icons.Outlined.CheckCircle to Color(0xFF248A3D)
                    }
                    Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text(item.title, style = MaterialTheme.typography.titleSmall, color = Folio.colors.ink)
                        Text(item.detail, style = MaterialTheme.typography.bodySmall, color = Folio.colors.secondary)
                    }
                }
            }
        }
    }
}

@Composable
private fun ExportSheet(
    vm: PreviewViewModel,
    fullName: String,
    docName: String,
    report: CheckReport,
    snackbar: SnackbarHostState,
    onDismiss: () -> Unit,
) {
    val context = LocalContext.current
    val haptics = LocalHapticFeedback.current
    val scope = rememberCoroutineScope()
    var fileName by remember { mutableStateOf(PdfExporter.fileName(fullName, docName)) }
    val pdfName = if (fileName.endsWith(".pdf", ignoreCase = true)) fileName else "$fileName.pdf"

    fun done(ok: Boolean, message: String) {
        if (ok) haptics.performHapticFeedback(HapticFeedbackType.LongPress)
        onDismiss()
        scope.launch { snackbar.showSnackbar(if (ok) message else "Something went wrong. Please try again.") }
    }

    val savePdf = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/pdf")) { uri ->
        if (uri != null) vm.savePdf(context, uri) { ok -> done(ok, "PDF saved") }
    }
    val saveJson = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri ->
        if (uri != null) vm.saveJson(context, uri) { ok -> done(ok, "Data exported") }
    }

    FolioSheet(onDismiss) {
        Text("Export", style = MaterialTheme.typography.headlineSmall, color = Folio.colors.ink)
        Text(
            if (report.problems.isEmpty()) "Your CV is ready to send." else "${report.problems.size} thing${if (report.problems.size == 1) "" else "s"} to fix first. See CV check.",
            style = MaterialTheme.typography.bodyMedium,
            color = if (report.problems.isEmpty()) Folio.colors.secondary else Folio.colors.destructive,
        )
        Spacer(Modifier.height(16.dp))
        FolioField(fileName, { fileName = it }, "File name")
        Spacer(Modifier.height(16.dp))
        FolioCard(Modifier.fillMaxWidth()) {
            Column {
                ExportRow(Icons.Outlined.IosShare, "Share PDF", "Email, messages, Drive and more") {
                    vm.pdfForSharing(context, pdfName) { uri ->
                        if (uri == null) {
                            done(false, "")
                        } else {
                            val send = Intent(Intent.ACTION_SEND).apply {
                                type = "application/pdf"
                                putExtra(Intent.EXTRA_STREAM, uri)
                                putExtra(Intent.EXTRA_SUBJECT, pdfName.removeSuffix(".pdf"))
                                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                            }
                            context.startActivity(Intent.createChooser(send, "Share CV"))
                            onDismiss()
                        }
                    }
                }
                HorizontalDivider(color = Folio.colors.separator, modifier = Modifier.padding(start = 52.dp))
                ExportRow(Icons.Outlined.Download, "Save PDF", "Choose where to keep it") { savePdf.launch(pdfName) }
                HorizontalDivider(color = Folio.colors.separator, modifier = Modifier.padding(start = 52.dp))
                ExportRow(Icons.Outlined.Print, "Print", "Any printer Android can reach") {
                    val state = vm.state.value
                    if (state != null) {
                        val printManager = context.getSystemService(PrintManager::class.java)
                        printManager?.print(pdfName.removeSuffix(".pdf"), CvPrintAdapter(state.document, vm.images, pdfName), null)
                    }
                    onDismiss()
                }
                HorizontalDivider(color = Folio.colors.separator, modifier = Modifier.padding(start = 52.dp))
                ExportRow(Icons.Outlined.DataObject, "Export data", "JSON Resume file, for backup or other tools") {
                    saveJson.launch(pdfName.removeSuffix(".pdf") + ".json")
                }
            }
        }
    }
}

@Composable
private fun ExportRow(icon: ImageVector, title: String, subtitle: String, onClick: () -> Unit) {
    Surface(onClick = onClick, color = Color.Transparent, modifier = Modifier.fillMaxWidth()) {
        Row(Modifier.padding(horizontal = 16.dp, vertical = 14.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, contentDescription = null, tint = Folio.colors.accent)
            Spacer(Modifier.width(16.dp))
            Column {
                Text(title, style = MaterialTheme.typography.titleSmall, color = Folio.colors.ink)
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = Folio.colors.secondary)
            }
        }
    }
}
