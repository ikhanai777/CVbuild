@file:OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)

package com.folio.cv.ui.editor

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.ArrowDownward
import androidx.compose.material.icons.outlined.ArrowUpward
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.MoreHoriz
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.folio.cv.model.Dates
import com.folio.cv.model.Entry
import com.folio.cv.model.Resume
import com.folio.cv.model.Section
import com.folio.cv.model.SectionContent
import com.folio.cv.model.SectionType
import com.folio.cv.model.addEntry
import com.folio.cv.model.addGroup
import com.folio.cv.model.addSection
import com.folio.cv.model.moveEntry
import com.folio.cv.model.moveSection
import com.folio.cv.model.removeEntry
import com.folio.cv.model.removeGroup
import com.folio.cv.model.removeSection
import com.folio.cv.model.splitItems
import com.folio.cv.model.updateEntry
import com.folio.cv.model.updateGroup
import com.folio.cv.model.updateSection
import com.folio.cv.template.PhotoShape
import com.folio.cv.template.Templates
import com.folio.cv.ui.components.FolioCard
import com.folio.cv.ui.components.FolioField
import com.folio.cv.ui.components.QuietButton
import com.folio.cv.ui.components.SectionLabel
import com.folio.cv.ui.theme.Folio

private val paneContent = PaddingValues(start = 20.dp, end = 20.dp, top = 8.dp, bottom = 120.dp)

@Composable
private fun PaneList(content: LazyListScope.() -> Unit) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().imePadding(),
        contentPadding = paneContent,
        verticalArrangement = Arrangement.spacedBy(12.dp),
        content = content,
    )
}

/** A text field that keeps its own text while typing and reloads only when undo or redo changes the document. */
@Composable
fun BoundField(
    value: String,
    onChange: (String) -> Unit,
    label: String,
    revision: Int,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    hint: String? = null,
    singleLine: Boolean = true,
    minLines: Int = 1,
    keyboardType: KeyboardType = KeyboardType.Text,
    capitalization: KeyboardCapitalization = KeyboardCapitalization.Sentences,
) {
    var text by remember(revision) { mutableStateOf(value) }
    FolioField(
        value = text,
        onValueChange = {
            text = it
            onChange(it)
        },
        label = label,
        modifier = modifier,
        placeholder = placeholder,
        hint = hint,
        singleLine = singleLine,
        minLines = minLines,
        keyboardType = keyboardType,
        capitalization = capitalization,
    )
}

/** Accepts MM/YYYY or YYYY and stores the normalized form. */
@Composable
private fun DateField(value: String, onChange: (String) -> Unit, label: String, revision: Int, modifier: Modifier = Modifier) {
    var text by remember(revision) { mutableStateOf(display(value)) }
    val valid = Dates.normalize(text) != null
    FolioField(
        value = text,
        onValueChange = {
            text = it
            Dates.normalize(it)?.let(onChange)
        },
        label = label,
        placeholder = "MM/YYYY",
        error = if (!valid) "Use MM/YYYY or YYYY" else null,
        keyboardType = KeyboardType.Number,
        modifier = modifier,
    )
}

private fun display(stored: String): String {
    val p = stored.split("-")
    return if (p.size == 2) "${p[1]}/${p[0]}" else stored
}

// ------------------------------------------------------------------ outline

@Composable
fun OutlinePane(
    resume: Resume,
    vm: EditorViewModel,
    openHeader: () -> Unit,
    openSection: (String) -> Unit,
    openTemplates: () -> Unit,
) {
    val haptics = LocalHapticFeedback.current
    PaneList {
        item {
            FolioCard(onClick = openHeader, modifier = Modifier.fillMaxWidth()) {
                Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(
                            resume.header.displayName.ifBlank { "Add your name" },
                            style = MaterialTheme.typography.titleMedium,
                            color = if (resume.header.fullName.isBlank()) Folio.colors.secondary else Folio.colors.ink,
                        )
                        val sub = listOf(resume.header.headline, resume.header.email).filter { it.isNotBlank() }.joinToString("  ·  ")
                        Text(
                            sub.ifBlank { "Headline, contact details, photo" },
                            style = MaterialTheme.typography.bodySmall,
                            color = Folio.colors.secondary,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                    Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = Folio.colors.secondary)
                }
            }
        }
        item { SectionLabel("Sections") }
        itemsIndexed(resume.sections, key = { _, s -> s.id }) { index, section ->
            SectionRow(
                section = section,
                isFirst = index == 0,
                isLast = index == resume.sections.lastIndex,
                onOpen = { openSection(section.id) },
                onToggle = { vm.edit { r -> r.updateSection(section.id) { it.copy(visible = !it.visible) } } },
                onMove = { delta ->
                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                    vm.edit { it.moveSection(section.id, delta) }
                },
                onDelete = { vm.edit { it.removeSection(section.id) } },
                modifier = Modifier.animateItem(),
            )
        }
        item {
            AddSectionButton(resume) { type ->
                var created: String? = null
                vm.edit { r ->
                    val (next, s) = r.addSection(type)
                    created = s.id
                    next
                }
                created?.let(openSection)
            }
        }
        item { SectionLabel("Design") }
        item {
            val t = Templates.get(resume.style.templateId)
            FolioCard(onClick = openTemplates, modifier = Modifier.fillMaxWidth()) {
                Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text("Template", style = MaterialTheme.typography.bodySmall, color = Folio.colors.secondary)
                        Text(t.name, style = MaterialTheme.typography.titleMedium, color = Folio.colors.ink)
                        Text(t.tagline, style = MaterialTheme.typography.bodySmall, color = Folio.colors.secondary)
                    }
                    Text("Change", style = MaterialTheme.typography.labelLarge, color = Folio.colors.accent)
                }
            }
        }
    }
}

@Composable
private fun SectionRow(
    section: Section,
    isFirst: Boolean,
    isLast: Boolean,
    onOpen: () -> Unit,
    onToggle: () -> Unit,
    onMove: (Int) -> Unit,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var menu by remember { mutableStateOf(false) }
    FolioCard(onClick = onOpen, modifier = modifier.fillMaxWidth()) {
        Row(Modifier.padding(start = 16.dp, top = 6.dp, bottom = 6.dp, end = 4.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f).padding(vertical = 8.dp)) {
                Text(
                    section.title,
                    style = MaterialTheme.typography.titleSmall,
                    color = if (section.visible) Folio.colors.ink else Folio.colors.secondary,
                )
                Text(
                    summary(section),
                    style = MaterialTheme.typography.bodySmall,
                    color = Folio.colors.secondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            IconButton(onClick = onToggle) {
                Icon(
                    if (section.visible) Icons.Outlined.Visibility else Icons.Outlined.VisibilityOff,
                    contentDescription = if (section.visible) "Hide ${section.title}" else "Show ${section.title}",
                    tint = Folio.colors.secondary,
                )
            }
            Box {
                IconButton(onClick = { menu = true }) {
                    Icon(Icons.Outlined.MoreHoriz, contentDescription = "More for ${section.title}", tint = Folio.colors.secondary)
                }
                DropdownMenu(expanded = menu, onDismissRequest = { menu = false }) {
                    if (!isFirst) DropdownMenuItem(text = { Text("Move up") }, onClick = { menu = false; onMove(-1) })
                    if (!isLast) DropdownMenuItem(text = { Text("Move down") }, onClick = { menu = false; onMove(1) })
                    DropdownMenuItem(
                        text = { Text("Delete section", color = Folio.colors.destructive) },
                        onClick = { menu = false; onDelete() },
                    )
                }
            }
        }
    }
}

private fun summary(section: Section): String {
    val base = when (section.type.content) {
        SectionContent.TEXT -> section.text.ifBlank { "Empty" }
        SectionContent.ENTRIES -> {
            val list = section.entries.filterNot { it.isBlank }
            if (list.isEmpty()) "Empty" else list.joinToString("  ·  ") { it.title.ifBlank { it.organization } }
        }
        SectionContent.GROUPS -> {
            val n = section.groups.sumOf { it.items.size }
            if (n == 0) "Empty" else section.groups.flatMap { it.items }.take(6).joinToString(", ")
        }
    }
    return if (section.visible) base else "Hidden  ·  $base"
}

@Composable
private fun AddSectionButton(resume: Resume, onAdd: (SectionType) -> Unit) {
    var open by remember { mutableStateOf(false) }
    val present = resume.sections.map { it.type }.toSet()
    val options = SectionType.entries.filter { it == SectionType.CUSTOM || it !in present }
    Box {
        Surface(
            onClick = { open = true },
            color = Color.Transparent,
            shape = MaterialTheme.shapes.large,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.Add, contentDescription = null, tint = Folio.colors.accent)
                Spacer(Modifier.width(12.dp))
                Text("Add section", style = MaterialTheme.typography.labelLarge, color = Folio.colors.accent)
            }
        }
        DropdownMenu(expanded = open, onDismissRequest = { open = false }) {
            options.forEach { type ->
                DropdownMenuItem(text = { Text(type.defaultTitle) }, onClick = {
                    open = false
                    onAdd(type)
                })
            }
        }
    }
}

// ------------------------------------------------------------------ header

@Composable
fun HeaderPane(resume: Resume, vm: EditorViewModel, revision: Int) {
    val h = resume.header
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        if (uri != null) vm.setPhoto(uri)
    }
    fun set(key: String, f: (com.folio.cv.model.Header) -> com.folio.cv.model.Header) =
        vm.edit("header.$key") { it.copy(header = f(it.header)) }

    PaneList {
        item {
            BoundField(h.fullName, { v -> set("name") { it.copy(fullName = v) } }, "Full name", revision, capitalization = KeyboardCapitalization.Words)
        }
        item {
            BoundField(h.headline, { v -> set("headline") { it.copy(headline = v) } }, "Headline", revision,
                placeholder = "Mechanical Design Engineer", hint = "Your role in a few words. It sits right under your name.")
        }
        item {
            BoundField(h.credentials, { v -> set("credentials") { it.copy(credentials = v) } }, "Credentials (optional)", revision,
                placeholder = "PE, CEng, CSWP", hint = "Licenses or post-nominals, shown after your name.",
                capitalization = KeyboardCapitalization.Characters)
        }
        item { SectionLabel("Contact") }
        item {
            BoundField(h.email, { v -> set("email") { it.copy(email = v) } }, "Email", revision,
                keyboardType = KeyboardType.Email, capitalization = KeyboardCapitalization.None)
        }
        item {
            BoundField(h.phone, { v -> set("phone") { it.copy(phone = v) } }, "Phone", revision, keyboardType = KeyboardType.Phone)
        }
        item {
            BoundField(h.location, { v -> set("location") { it.copy(location = v) } }, "City, country", revision,
                capitalization = KeyboardCapitalization.Words)
        }
        item {
            BoundField(h.website, { v -> set("website") { it.copy(website = v) } }, "Website or portfolio", revision,
                keyboardType = KeyboardType.Uri, capitalization = KeyboardCapitalization.None)
        }
        item {
            BoundField(h.linkedin, { v -> set("linkedin") { it.copy(linkedin = v) } }, "LinkedIn", revision,
                placeholder = "linkedin.com/in/yourname", keyboardType = KeyboardType.Uri, capitalization = KeyboardCapitalization.None)
        }
        item {
            BoundField(h.github, { v -> set("github") { it.copy(github = v) } }, "GitHub", revision,
                placeholder = "github.com/yourname", keyboardType = KeyboardType.Uri, capitalization = KeyboardCapitalization.None)
        }
        item { SectionLabel("Photo") }
        item {
            val portraitTemplates = Templates.all.filter { it.photo != PhotoShape.NONE }.joinToString { it.name }
            FolioCard(modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.Person, contentDescription = null, tint = Folio.colors.secondary)
                        Spacer(Modifier.width(12.dp))
                        Text(
                            if (h.photoPath == null) "No photo" else "Photo added",
                            style = MaterialTheme.typography.titleSmall,
                            color = Folio.colors.ink,
                            modifier = Modifier.weight(1f),
                        )
                        if (h.photoPath != null) QuietButton("Remove", vm::removePhoto, color = Folio.colors.destructive)
                        QuietButton(if (h.photoPath == null) "Add" else "Change", {
                            picker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                        })
                    }
                    Spacer(Modifier.height(6.dp))
                    Text(
                        "Shown on $portraitTemplates. Common in Europe and Asia; US and UK recruiters usually prefer no photo.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Folio.colors.secondary,
                    )
                }
            }
        }
    }
}

// ------------------------------------------------------------------ section

@Composable
fun SectionPane(section: Section, vm: EditorViewModel, revision: Int, openEntry: (String) -> Unit, onDeleted: () -> Unit) {
    PaneList {
        item {
            BoundField(section.title, { v -> vm.edit("section.title.${section.id}") { r -> r.updateSection(section.id) { it.copy(title = v) } } },
                "Section title", revision, capitalization = KeyboardCapitalization.Words)
        }
        item {
            ToggleRow("Show on CV", section.visible) { on -> vm.edit { r -> r.updateSection(section.id) { it.copy(visible = on) } } }
        }
        when (section.type.content) {
            SectionContent.TEXT -> item {
                val n = section.text.length
                BoundField(
                    section.text,
                    { v -> vm.edit("section.text.${section.id}") { r -> r.updateSection(section.id) { it.copy(text = v) } } },
                    if (section.type == SectionType.SUMMARY) "Summary" else "Text",
                    revision,
                    singleLine = false,
                    minLines = 6,
                    placeholder = "Two or three sentences: what you do, what you're known for, what you want next.",
                    hint = "$n characters  ·  aim for 200 to 600",
                )
            }
            SectionContent.ENTRIES -> {
                val entries = section.entries
                itemsIndexed(entries, key = { _, e -> e.id }) { index, entry ->
                    EntryRow(
                        entry = entry,
                        canMoveUp = index > 0,
                        canMoveDown = index < entries.lastIndex,
                        onOpen = { openEntry(entry.id) },
                        onMove = { d -> vm.edit { it.moveEntry(section.id, entry.id, d) } },
                        modifier = Modifier.animateItem(),
                    )
                }
                item {
                    AddRow("Add ${entryNoun(section.type)}") {
                        var created: String? = null
                        vm.edit { r ->
                            val (next, e) = r.addEntry(section.id)
                            created = e.id
                            next
                        }
                        created?.let(openEntry)
                    }
                }
            }
            SectionContent.GROUPS -> {
                itemsIndexed(section.groups, key = { _, g -> g.id }) { _, group ->
                    FolioCard(modifier = Modifier.fillMaxWidth().animateItem()) {
                        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                BoundField(
                                    group.name,
                                    { v -> vm.edit("group.name.${group.id}") { r -> r.updateGroup(section.id, group.id) { it.copy(name = v) } } },
                                    "Group (optional)",
                                    revision,
                                    placeholder = if (section.type == SectionType.SKILLS) "CAD / CAE" else "",
                                    modifier = Modifier.weight(1f),
                                )
                                IconButton(onClick = { vm.edit { it.removeGroup(section.id, group.id) } }) {
                                    Icon(Icons.Outlined.Close, contentDescription = "Remove group", tint = Folio.colors.secondary)
                                }
                            }
                            var text by remember(revision, group.id) { mutableStateOf(group.items.joinToString(", ")) }
                            FolioField(
                                value = text,
                                onValueChange = { v ->
                                    text = v
                                    vm.edit("group.items.${group.id}") { r -> r.updateGroup(section.id, group.id) { it.copy(items = splitItems(v)) } }
                                },
                                label = if (section.type == SectionType.LANGUAGES) "Languages" else "Skills",
                                placeholder = if (section.type == SectionType.LANGUAGES) "English (native), German (B2)" else "SolidWorks, ANSYS, GD&T",
                                hint = "Separate with commas",
                                singleLine = false,
                                minLines = 2,
                            )
                        }
                    }
                }
                item { AddRow("Add group") { vm.edit { it.addGroup(section.id) } } }
            }
        }
        item {
            Spacer(Modifier.height(12.dp))
            QuietButton("Delete section", {
                vm.edit { it.removeSection(section.id) }
                onDeleted()
            }, color = Folio.colors.destructive)
        }
    }
}

private fun entryNoun(type: SectionType) = when (type) {
    SectionType.EXPERIENCE -> "role"
    SectionType.EDUCATION -> "education"
    SectionType.PROJECTS -> "project"
    SectionType.CERTIFICATIONS -> "license or certification"
    SectionType.PATENTS -> "patent"
    SectionType.PUBLICATIONS -> "publication"
    SectionType.AWARDS -> "award"
    SectionType.REFERENCES -> "reference"
    else -> "entry"
}

@Composable
private fun EntryRow(
    entry: Entry,
    canMoveUp: Boolean,
    canMoveDown: Boolean,
    onOpen: () -> Unit,
    onMove: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    FolioCard(onClick = onOpen, modifier = modifier.fillMaxWidth()) {
        Row(Modifier.padding(start = 16.dp, end = 4.dp, top = 4.dp, bottom = 4.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f).padding(vertical = 10.dp)) {
                Text(
                    entry.title.ifBlank { entry.organization.ifBlank { "Untitled" } },
                    style = MaterialTheme.typography.titleSmall,
                    color = Folio.colors.ink,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                val sub = listOf(
                    if (entry.title.isNotBlank()) entry.organization else "",
                    Dates.range(entry.start, entry.end, entry.current, com.folio.cv.model.DateFormat.SHORT_MONTH),
                ).filter { it.isNotBlank() }.joinToString("  ·  ")
                if (sub.isNotEmpty()) {
                    Text(sub, style = MaterialTheme.typography.bodySmall, color = Folio.colors.secondary, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
            IconButton(onClick = { onMove(-1) }, enabled = canMoveUp) {
                Icon(Icons.Outlined.ArrowUpward, contentDescription = "Move up", tint = if (canMoveUp) Folio.colors.secondary else Folio.colors.separator)
            }
            IconButton(onClick = { onMove(1) }, enabled = canMoveDown) {
                Icon(Icons.Outlined.ArrowDownward, contentDescription = "Move down", tint = if (canMoveDown) Folio.colors.secondary else Folio.colors.separator)
            }
        }
    }
}

@Composable
private fun AddRow(text: String, onClick: () -> Unit) {
    Surface(onClick = onClick, color = Color.Transparent, shape = MaterialTheme.shapes.large, modifier = Modifier.fillMaxWidth()) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Outlined.Add, contentDescription = null, tint = Folio.colors.accent)
            Spacer(Modifier.width(12.dp))
            Text(text, style = MaterialTheme.typography.labelLarge, color = Folio.colors.accent)
        }
    }
}

@Composable
private fun ToggleRow(label: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    FolioCard(modifier = Modifier.fillMaxWidth()) {
        Row(Modifier.padding(horizontal = 16.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(label, style = MaterialTheme.typography.bodyLarge, color = Folio.colors.ink, modifier = Modifier.weight(1f))
            Switch(
                checked = checked,
                onCheckedChange = onChange,
                colors = SwitchDefaults.colors(checkedTrackColor = Folio.colors.accent),
            )
        }
    }
}

// ------------------------------------------------------------------ entry

private data class EntryLabels(val title: String, val org: String, val titleHint: String, val orgHint: String)

private fun labels(type: SectionType) = when (type) {
    SectionType.EXPERIENCE -> EntryLabels("Job title", "Company", "Mechanical Design Engineer", "Northfield Drive Systems")
    SectionType.EDUCATION -> EntryLabels("Degree or qualification", "School or university", "B.S. Mechanical Engineering", "The Ohio State University")
    SectionType.PROJECTS -> EntryLabels("Project", "Client, team or context", "Lightweight gearbox housing", "Senior design team")
    SectionType.CERTIFICATIONS -> EntryLabels("License or certification", "Issued by", "Professional Engineer (PE)", "State board")
    SectionType.PATENTS -> EntryLabels("Patent title", "Number or status", "Housing with integrated coolant gallery", "US 11,000,000 B2")
    SectionType.PUBLICATIONS -> EntryLabels("Title", "Journal, conference or publisher", "", "ASME IMECE")
    SectionType.AWARDS -> EntryLabels("Award", "Awarded by", "", "")
    SectionType.VOLUNTEERING -> EntryLabels("Role", "Organization", "", "")
    SectionType.REFERENCES -> EntryLabels("Name", "Role and company", "", "")
    else -> EntryLabels("Title", "Organization", "", "")
}

private val weakOpeners = listOf("responsible for", "helped", "worked on", "assisted", "involved in", "duties included")

@Composable
fun EntryPane(section: Section, entry: Entry, vm: EditorViewModel, revision: Int, onDeleted: () -> Unit) {
    val type = section.type
    val l = labels(type)
    val hasRange = type in setOf(SectionType.EXPERIENCE, SectionType.EDUCATION, SectionType.PROJECTS, SectionType.VOLUNTEERING, SectionType.CUSTOM)
    val hasDate = type != SectionType.REFERENCES
    val hasLocation = type in setOf(SectionType.EXPERIENCE, SectionType.EDUCATION, SectionType.VOLUNTEERING, SectionType.CUSTOM)
    val hasBullets = type in setOf(SectionType.EXPERIENCE, SectionType.EDUCATION, SectionType.PROJECTS, SectionType.VOLUNTEERING, SectionType.CUSTOM)
    val hasTags = type in setOf(SectionType.EXPERIENCE, SectionType.PROJECTS, SectionType.CUSTOM)

    fun set(key: String?, f: (Entry) -> Entry) = vm.edit(key?.let { "entry.$it.${entry.id}" }) { it.updateEntry(section.id, entry.id, f) }

    PaneList {
        item {
            BoundField(entry.title, { v -> set("title") { it.copy(title = v) } }, l.title, revision,
                placeholder = l.titleHint.ifBlank { null }, capitalization = KeyboardCapitalization.Words)
        }
        item {
            BoundField(entry.organization, { v -> set("org") { it.copy(organization = v) } }, l.org, revision,
                placeholder = l.orgHint.ifBlank { null }, capitalization = KeyboardCapitalization.Words)
        }
        if (hasLocation) item {
            BoundField(entry.location, { v -> set("location") { it.copy(location = v) } }, "Location", revision,
                capitalization = KeyboardCapitalization.Words)
        }
        if (hasDate) item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                DateField(entry.start, { v -> set("start") { it.copy(start = v) } }, if (hasRange) "Start" else "Date", revision, Modifier.weight(1f))
                if (hasRange && !entry.current) {
                    DateField(entry.end, { v -> set("end") { it.copy(end = v) } }, "End", revision, Modifier.weight(1f))
                }
            }
        }
        if (hasRange) item {
            val label = when (type) {
                SectionType.EXPERIENCE -> "I currently work here"
                SectionType.EDUCATION -> "I'm currently studying here"
                else -> "Ongoing"
            }
            ToggleRow(label, entry.current) { on -> set(null) { it.copy(current = on) } }
        }
        item {
            BoundField(
                entry.description,
                { v -> set("description") { it.copy(description = v) } },
                if (type == SectionType.REFERENCES) "Contact details" else "Description (optional)",
                revision,
                singleLine = false,
                minLines = 2,
            )
        }
        if (hasBullets) {
            item { SectionLabel("Achievements") }
            item {
                FolioCard(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        "Start with a verb, end with a number. “Cut scrap from 4.1% to 0.9% by redesigning the fixture.”",
                        style = MaterialTheme.typography.bodySmall,
                        color = Folio.colors.secondary,
                        modifier = Modifier.padding(12.dp),
                    )
                }
            }
            itemsIndexed(entry.bullets, key = { i, _ -> "b$i" }) { i, bullet ->
                val lower = bullet.trim().lowercase()
                val note = when {
                    bullet.isBlank() -> null
                    weakOpeners.any { lower.startsWith(it) } -> "Try a stronger verb: Designed, Led, Reduced, Validated."
                    bullet.none { it.isDigit() } -> "Can you add a number? Mass, cost, time, %, units."
                    bullet.length > 240 -> "Long bullet. Aim for two lines."
                    else -> null
                }
                Row(verticalAlignment = Alignment.Top) {
                    BoundField(
                        bullet,
                        { v -> set("bullet$i") { e -> e.copy(bullets = e.bullets.mapIndexed { j, b -> if (j == i) v else b }) } },
                        "Bullet ${i + 1}",
                        revision,
                        singleLine = false,
                        hint = note,
                        modifier = Modifier.weight(1f),
                    )
                    Column {
                        IconButton(onClick = {
                            set(null) { e -> e.copy(bullets = e.bullets.filterIndexed { j, _ -> j != i }) }
                            vm.bumpRevision()
                        }) {
                            Icon(Icons.Outlined.Close, contentDescription = "Remove bullet ${i + 1}", tint = Folio.colors.secondary)
                        }
                        if (i > 0) {
                            IconButton(onClick = {
                                set(null) { e -> e.copy(bullets = e.bullets.toMutableList().apply { add(i - 1, removeAt(i)) }) }
                                vm.bumpRevision()
                            }) {
                                Icon(Icons.Outlined.ArrowUpward, contentDescription = "Move bullet ${i + 1} up", tint = Folio.colors.secondary)
                            }
                        }
                    }
                }
            }
            item { AddRow("Add bullet") { set(null) { it.copy(bullets = it.bullets + "") } } }
        }
        if (hasTags) item {
            var text by remember(revision, entry.id) { mutableStateOf(entry.tags.joinToString(", ")) }
            FolioField(
                value = text,
                onValueChange = { v ->
                    text = v
                    set("tags") { it.copy(tags = splitItems(v)) }
                },
                label = "Tools & keywords (optional)",
                placeholder = "SolidWorks, ANSYS, GD&T",
                hint = "Shown under the entry on templates that support it. Great for ATS keyword matching.",
                singleLine = false,
            )
        }
        item {
            Spacer(Modifier.height(12.dp))
            HorizontalDivider(color = Folio.colors.separator)
            QuietButton("Delete ${entryNoun(type)}", {
                vm.edit { it.removeEntry(section.id, entry.id) }
                onDeleted()
            }, color = Folio.colors.destructive)
        }
    }
}
