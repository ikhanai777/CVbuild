package com.folio.cv.model

/** Pure, immutable edits on a [Resume]. The editor composes these; tests cover them on the JVM. */

fun Resume.updateSection(sectionId: String, f: (Section) -> Section): Resume =
    copy(sections = sections.map { if (it.id == sectionId) f(it) else it })

fun Resume.updateEntry(sectionId: String, entryId: String, f: (Entry) -> Entry): Resume =
    updateSection(sectionId) { s -> s.copy(entries = s.entries.map { if (it.id == entryId) f(it) else it }) }

fun Resume.updateGroup(sectionId: String, groupId: String, f: (SkillGroup) -> SkillGroup): Resume =
    updateSection(sectionId) { s -> s.copy(groups = s.groups.map { if (it.id == groupId) f(it) else it }) }

fun Resume.addSection(type: SectionType): Pair<Resume, Section> {
    val section = Starters.emptySection(type)
    return copy(sections = sections + section) to section
}

fun Resume.removeSection(sectionId: String): Resume = copy(sections = sections.filterNot { it.id == sectionId })

fun Resume.moveSection(sectionId: String, delta: Int): Resume = copy(sections = sections.moved(sectionId, delta) { it.id })

fun Resume.addEntry(sectionId: String): Pair<Resume, Entry> {
    val entry = Entry(Ids.new())
    return updateSection(sectionId) { it.copy(entries = it.entries + entry) } to entry
}

fun Resume.removeEntry(sectionId: String, entryId: String): Resume =
    updateSection(sectionId) { s -> s.copy(entries = s.entries.filterNot { it.id == entryId }) }

fun Resume.moveEntry(sectionId: String, entryId: String, delta: Int): Resume =
    updateSection(sectionId) { s -> s.copy(entries = s.entries.moved(entryId, delta) { it.id }) }

fun Resume.addGroup(sectionId: String): Resume =
    updateSection(sectionId) { it.copy(groups = it.groups + SkillGroup(Ids.new())) }

fun Resume.removeGroup(sectionId: String, groupId: String): Resume =
    updateSection(sectionId) { s -> s.copy(groups = s.groups.filterNot { it.id == groupId }) }

/** A deep copy with fresh ids, used by Duplicate. */
fun Resume.duplicate(now: Long, newName: String = "$name copy"): Resume = copy(
    id = Ids.new(),
    name = newName,
    createdAt = now,
    updatedAt = now,
    sections = sections.map { s ->
        s.copy(
            id = Ids.new(),
            entries = s.entries.map { it.copy(id = Ids.new()) },
            groups = s.groups.map { it.copy(id = Ids.new()) },
        )
    },
)

/** Splits "a, b,  c" into trimmed items; used for tags and skill fields. */
fun splitItems(text: String): List<String> = text.split(',', ';', '\n').map { it.trim() }.filter { it.isNotEmpty() }

fun <T> List<T>.moved(id: String, delta: Int, idOf: (T) -> String): List<T> {
    val from = indexOfFirst { idOf(it) == id }
    if (from < 0) return this
    val to = (from + delta).coerceIn(0, size - 1)
    if (to == from) return this
    val list = toMutableList()
    val item = list.removeAt(from)
    list.add(to, item)
    return list
}
