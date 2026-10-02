package com.folio.cv.data

import com.folio.cv.model.Dates
import com.folio.cv.model.Entry
import com.folio.cv.model.Header
import com.folio.cv.model.Ids
import com.folio.cv.model.Resume
import com.folio.cv.model.Section
import com.folio.cv.model.SectionType
import com.folio.cv.model.SkillGroup
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.put

/**
 * Data portability. Exports [JSON Resume](https://jsonresume.org) so a CV can move to other tools,
 * with Folio's full document embedded for a lossless round trip. Imports either format.
 */
object Portability {

    private val json get() = ResumeRepository.json

    fun export(resume: Resume): String {
        val h = resume.header
        val root = buildJsonObject {
            put("\$schema", "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json")
            put("basics", buildJsonObject {
                put("name", h.fullName)
                put("label", h.headline)
                put("email", h.email)
                put("phone", h.phone)
                put("url", h.website)
                put("summary", resume.sections.firstOrNull { it.type == SectionType.SUMMARY }?.text.orEmpty())
                put("location", buildJsonObject { put("city", h.location) })
                put("profiles", buildJsonArray {
                    if (h.linkedin.isNotBlank()) add(buildJsonObject { put("network", "LinkedIn"); put("url", h.linkedin) })
                    if (h.github.isNotBlank()) add(buildJsonObject { put("network", "GitHub"); put("url", h.github) })
                })
            })
            put("work", entries(resume, SectionType.EXPERIENCE) { e ->
                put("name", e.organization); put("position", e.title); put("location", e.location)
                put("startDate", e.start); put("endDate", if (e.current) "" else e.end)
                put("summary", e.description); put("highlights", strings(e.bullets))
            })
            put("education", entries(resume, SectionType.EDUCATION) { e ->
                put("institution", e.organization); put("studyType", e.title)
                put("startDate", e.start); put("endDate", e.end); put("courses", strings(e.bullets))
            })
            put("projects", entries(resume, SectionType.PROJECTS) { e ->
                put("name", e.title); put("description", e.description); put("startDate", e.start)
                put("endDate", e.end); put("highlights", strings(e.bullets)); put("keywords", strings(e.tags))
            })
            put("certificates", entries(resume, SectionType.CERTIFICATIONS) { e ->
                put("name", e.title); put("issuer", e.organization); put("date", e.start)
            })
            put("awards", entries(resume, SectionType.AWARDS) { e ->
                put("title", e.title); put("awarder", e.organization); put("date", e.start); put("summary", e.description)
            })
            put("publications", entries(resume, SectionType.PUBLICATIONS) { e ->
                put("name", e.title); put("publisher", e.organization); put("releaseDate", e.start)
            })
            put("volunteer", entries(resume, SectionType.VOLUNTEERING) { e ->
                put("organization", e.organization); put("position", e.title)
                put("startDate", e.start); put("endDate", e.end); put("highlights", strings(e.bullets))
            })
            put("skills", buildJsonArray {
                resume.sections.filter { it.type == SectionType.SKILLS }.flatMap { it.groups }.forEach { g ->
                    add(buildJsonObject { put("name", g.name); put("keywords", strings(g.items)) })
                }
            })
            put("languages", buildJsonArray {
                resume.sections.filter { it.type == SectionType.LANGUAGES }.flatMap { it.groups }.flatMap { it.items }.forEach {
                    add(buildJsonObject { put("language", it) })
                }
            })
            put("meta", buildJsonObject {
                put("folio", json.encodeToJsonElement(Resume.serializer(), resume))
            })
        }
        return root.toString()
    }

    /** Parses Folio or JSON Resume text into a new CV with fresh ids. Returns null if neither fits. */
    fun import(text: String, now: Long): Resume? {
        val root = runCatching { json.parseToJsonElement(text).jsonObject }.getOrNull() ?: return null
        val folio = (root["meta"] as? JsonObject)?.get("folio")
            ?: root.takeIf { it.containsKey("header") && it.containsKey("sections") }
        if (folio != null) {
            val r = runCatching { json.decodeFromJsonElement(Resume.serializer(), folio) }.getOrNull()
            if (r != null) return r.copy(id = Ids.new(), createdAt = now, updatedAt = now)
        }
        val basics = root["basics"] as? JsonObject ?: return null
        return fromJsonResume(root, basics, now)
    }

    private fun fromJsonResume(root: JsonObject, basics: JsonObject, now: Long): Resume {
        val profiles = (basics["profiles"] as? JsonArray).orEmpty().mapNotNull { it as? JsonObject }
        fun profile(network: String) = profiles.firstOrNull { it.str("network").equals(network, true) }
            ?.let { it.str("url").ifBlank { it.str("username") } }.orEmpty()
        val location = (basics["location"] as? JsonObject)?.let {
            listOf(it.str("city"), it.str("region"), it.str("countryCode")).filter { s -> s.isNotBlank() }.joinToString(", ")
        }.orEmpty()

        val sections = mutableListOf<Section>()
        basics.str("summary").takeIf { it.isNotBlank() }?.let {
            sections += Section(Ids.new(), SectionType.SUMMARY, text = it)
        }
        fun add(type: SectionType, key: String, map: (JsonObject) -> Entry) {
            val list = (root[key] as? JsonArray).orEmpty().mapNotNull { it as? JsonObject }.map(map)
            if (list.isNotEmpty()) sections += Section(Ids.new(), type, entries = list)
        }
        add(SectionType.EXPERIENCE, "work") { o ->
            Entry(
                Ids.new(), o.str("position"), o.str("name").ifBlank { o.str("company") }, o.str("location"),
                date(o.str("startDate")), date(o.str("endDate")), o.str("endDate").isBlank() && o.str("startDate").isNotBlank(),
                o.str("summary"), o.list("highlights"),
            )
        }
        add(SectionType.EDUCATION, "education") { o ->
            val degree = listOf(o.str("studyType"), o.str("area")).filter { it.isNotBlank() }.joinToString(", ")
            Entry(Ids.new(), degree, o.str("institution"), start = date(o.str("startDate")), end = date(o.str("endDate")), bullets = o.list("courses"))
        }
        add(SectionType.PROJECTS, "projects") { o ->
            Entry(Ids.new(), o.str("name"), start = date(o.str("startDate")), end = date(o.str("endDate")),
                description = o.str("description"), bullets = o.list("highlights"), tags = o.list("keywords"))
        }
        add(SectionType.CERTIFICATIONS, "certificates") { o -> Entry(Ids.new(), o.str("name"), o.str("issuer"), start = date(o.str("date"))) }
        add(SectionType.AWARDS, "awards") { o -> Entry(Ids.new(), o.str("title"), o.str("awarder"), start = date(o.str("date")), description = o.str("summary")) }
        add(SectionType.PUBLICATIONS, "publications") { o -> Entry(Ids.new(), o.str("name"), o.str("publisher"), start = date(o.str("releaseDate"))) }
        add(SectionType.VOLUNTEERING, "volunteer") { o ->
            Entry(Ids.new(), o.str("position"), o.str("organization"), start = date(o.str("startDate")), end = date(o.str("endDate")), bullets = o.list("highlights"))
        }
        val skills = (root["skills"] as? JsonArray).orEmpty().mapNotNull { it as? JsonObject }
            .map { SkillGroup(Ids.new(), it.str("name"), it.list("keywords")) }
            .filter { it.items.isNotEmpty() || it.name.isNotBlank() }
            .map { if (it.items.isEmpty()) it.copy(name = "", items = listOf(it.name)) else it }
        if (skills.isNotEmpty()) sections += Section(Ids.new(), SectionType.SKILLS, groups = skills)
        val languages = (root["languages"] as? JsonArray).orEmpty().mapNotNull { it as? JsonObject }.map {
            listOf(it.str("language"), it.str("fluency")).filter { s -> s.isNotBlank() }.joinToString(" (") +
                if (it.str("fluency").isNotBlank()) ")" else ""
        }.filter { it.isNotBlank() }
        if (languages.isNotEmpty()) sections += Section(Ids.new(), SectionType.LANGUAGES, groups = listOf(SkillGroup(Ids.new(), items = languages)))

        val name = basics.str("name")
        return Resume(
            id = Ids.new(),
            name = if (name.isBlank()) "Imported CV" else "$name CV",
            header = Header(
                fullName = name, headline = basics.str("label"), email = basics.str("email"), phone = basics.str("phone"),
                location = location, website = basics.str("url").ifBlank { basics.str("website") },
                linkedin = profile("LinkedIn"), github = profile("GitHub"),
            ),
            sections = sections,
            createdAt = now,
            updatedAt = now,
        )
    }

    private fun date(s: String): String = Dates.normalize(s.take(7)) ?: s.take(4).takeIf { it.all(Char::isDigit) }.orEmpty()

    private fun JsonObject.str(key: String): String = (this[key] as? JsonPrimitive)?.contentOrNull?.trim().orEmpty()

    private fun JsonObject.list(key: String): List<String> =
        (this[key] as? JsonArray).orEmpty().mapNotNull { (it as? JsonPrimitive)?.contentOrNull?.trim() }.filter { it.isNotEmpty() }

    private fun strings(items: List<String>): JsonArray = JsonArray(items.map { JsonPrimitive(it) })

    private fun entries(resume: Resume, type: SectionType, fill: kotlinx.serialization.json.JsonObjectBuilder.(Entry) -> Unit): JsonElement =
        buildJsonArray {
            resume.sections.filter { it.type == type }.flatMap { it.entries }.filterNot { it.isBlank }.forEach { e ->
                add(buildJsonObject { fill(e) })
            }
        }
}
