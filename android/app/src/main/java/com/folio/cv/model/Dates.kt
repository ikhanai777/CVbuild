package com.folio.cv.model

/** Formats stored "YYYY-MM" / "YYYY" strings for display. Formatting happens only at render time. */
object Dates {
    private val months = listOf("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")

    /** Accepts "2024", "2024-3", "2024-03", "03/2024", "3/2024"; returns "YYYY" or "YYYY-MM", or null. */
    fun normalize(input: String): String? {
        val s = input.trim()
        if (s.isEmpty()) return ""
        Regex("""^(\d{4})$""").matchEntire(s)?.let { return it.groupValues[1] }
        Regex("""^(\d{4})[-/.](\d{1,2})$""").matchEntire(s)?.let {
            val m = it.groupValues[2].toInt()
            return if (m in 1..12) "${it.groupValues[1]}-${m.toString().padStart(2, '0')}" else null
        }
        Regex("""^(\d{1,2})[-/.](\d{4})$""").matchEntire(s)?.let {
            val m = it.groupValues[1].toInt()
            return if (m in 1..12) "${it.groupValues[2]}-${m.toString().padStart(2, '0')}" else null
        }
        return null
    }

    fun format(value: String, format: DateFormat): String {
        val v = value.trim()
        if (v.isEmpty()) return ""
        val parts = v.split("-")
        val year = parts[0]
        val month = parts.getOrNull(1)?.toIntOrNull()?.takeIf { it in 1..12 }
        return when {
            month == null || format == DateFormat.YEAR -> year
            format == DateFormat.SHORT_MONTH -> "${months[month - 1]} $year"
            else -> "${month.toString().padStart(2, '0')}/$year"
        }
    }

    /** "Mar 2021 – Present", "2019 – 2021", "2020" (single date), or "". Uses a true en dash. */
    fun range(start: String, end: String, current: Boolean, format: DateFormat): String {
        val s = format(start, format)
        val e = if (current) "Present" else format(end, format)
        return when {
            s.isEmpty() && e.isEmpty() -> ""
            s.isEmpty() -> e
            e.isEmpty() || s == e -> s
            else -> "$s – $e"
        }
    }

    /** Sort key so the newest entry sorts first; current roles always lead. */
    fun sortKey(entry: Entry): Int {
        if (entry.current) return Int.MAX_VALUE
        val v = entry.end.ifBlank { entry.start }
        val parts = v.split("-")
        val y = parts[0].toIntOrNull() ?: return 0
        val m = parts.getOrNull(1)?.toIntOrNull() ?: 12
        return y * 12 + m
    }
}
