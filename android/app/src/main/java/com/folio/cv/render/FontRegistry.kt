package com.folio.cv.render

import android.content.Context
import android.graphics.Typeface
import androidx.core.content.res.ResourcesCompat
import com.folio.cv.R
import com.folio.cv.template.FontFamilyId
import com.folio.cv.template.TypeRole
import com.folio.cv.template.Weight

/**
 * Loads the bundled SIL OFL fonts. The same font files back the on-screen preview and the PDF,
 * which is why the two always match.
 */
class FontRegistry(private val context: Context) {

    private data class Key(val family: FontFamilyId, val weight: Weight, val italic: Boolean)

    private val cache = HashMap<Key, Typeface>()

    fun typeface(role: TypeRole): Typeface = get(role.family, role.weight, role.italic)

    fun get(family: FontFamilyId, weight: Weight, italic: Boolean = false): Typeface = synchronized(cache) {
        cache.getOrPut(Key(family, weight, italic)) {
            runCatching { ResourcesCompat.getFont(context, resource(family, weight, italic)) }.getOrNull()
                ?: Typeface.create(Typeface.DEFAULT, if (weight == Weight.BOLD) Typeface.BOLD else Typeface.NORMAL)
        }
    }

    /** Maps a role to a bundled file. Missing italics fall back to the upright regular. */
    private fun resource(family: FontFamilyId, weight: Weight, italic: Boolean): Int = when (family) {
        FontFamilyId.INTER -> when {
            italic -> R.font.inter_italic
            weight == Weight.BOLD -> R.font.inter_semibold
            weight == Weight.MEDIUM -> R.font.inter_medium
            else -> R.font.inter_regular
        }
        FontFamilyId.PLEX_SANS -> when {
            italic -> R.font.plex_sans_italic
            weight == Weight.BOLD -> R.font.plex_sans_semibold
            weight == Weight.MEDIUM -> R.font.plex_sans_medium
            else -> R.font.plex_sans_regular
        }
        FontFamilyId.PLEX_MONO -> when (weight) {
            Weight.BOLD -> R.font.plex_mono_semibold
            Weight.MEDIUM -> R.font.plex_mono_medium
            Weight.REGULAR, Weight.LIGHT -> R.font.plex_mono_regular
        }
        FontFamilyId.GARAMOND -> when {
            italic -> R.font.garamond_italic
            weight == Weight.BOLD -> R.font.garamond_semibold
            weight == Weight.MEDIUM -> R.font.garamond_medium
            else -> R.font.garamond_regular
        }
        FontFamilyId.SOURCE_SERIF -> when {
            italic -> R.font.source_serif_italic
            weight == Weight.REGULAR || weight == Weight.LIGHT -> R.font.source_serif_regular
            else -> R.font.source_serif_semibold
        }
        FontFamilyId.FRAUNCES ->
            if (weight == Weight.REGULAR || weight == Weight.LIGHT) R.font.fraunces_regular else R.font.fraunces_semibold
        FontFamilyId.MANROPE -> when (weight) {
            Weight.BOLD -> R.font.manrope_bold
            Weight.MEDIUM -> R.font.manrope_semibold
            Weight.REGULAR, Weight.LIGHT -> R.font.manrope_regular
        }
        FontFamilyId.DM_SANS -> when {
            italic -> R.font.dm_sans_italic
            weight == Weight.BOLD -> R.font.dm_sans_bold
            weight == Weight.MEDIUM -> R.font.dm_sans_medium
            else -> R.font.dm_sans_regular
        }
        FontFamilyId.SPACE_GROTESK -> when (weight) {
            Weight.BOLD -> R.font.space_grotesk_bold
            Weight.MEDIUM -> R.font.space_grotesk_medium
            Weight.REGULAR, Weight.LIGHT -> R.font.space_grotesk_regular
        }
        FontFamilyId.JETBRAINS_MONO ->
            if (weight == Weight.REGULAR || weight == Weight.LIGHT) R.font.jetbrains_mono_regular else R.font.jetbrains_mono_medium
        FontFamilyId.POPPINS -> when (weight) {
            Weight.BOLD -> R.font.poppins_semibold
            Weight.MEDIUM -> R.font.poppins_medium
            Weight.REGULAR -> R.font.poppins_regular
            Weight.LIGHT -> R.font.poppins_light
        }
        FontFamilyId.LATO -> when {
            italic -> R.font.lato_italic
            weight == Weight.BOLD -> R.font.lato_bold
            weight == Weight.LIGHT -> R.font.lato_light
            else -> R.font.lato_regular
        }
    }
}
