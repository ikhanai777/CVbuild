package com.folio.cv.data

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import android.media.ExifInterface
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import kotlin.math.max

/**
 * Copies a picked photo into app-private storage, upright and downscaled to 600 px.
 * The re-encoded JPEG carries no EXIF data, so no location or device metadata ends up in a CV.
 */
class PhotoStore(private val context: Context) {
    private val dir = File(context.filesDir, "photos")

    suspend fun import(uri: Uri, resumeId: String): String? = withContext(Dispatchers.IO) {
        runCatching {
            val resolver = context.contentResolver
            val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
            var sample = 1
            while (max(bounds.outWidth, bounds.outHeight) / (sample * 2) >= 600) sample *= 2
            val decoded = resolver.openInputStream(uri)?.use {
                BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sample })
            } ?: return@runCatching null
            val rotation = resolver.openInputStream(uri)?.use {
                when (ExifInterface(it).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)) {
                    ExifInterface.ORIENTATION_ROTATE_90 -> 90f
                    ExifInterface.ORIENTATION_ROTATE_180 -> 180f
                    ExifInterface.ORIENTATION_ROTATE_270 -> 270f
                    else -> 0f
                }
            } ?: 0f
            val scale = 600f / max(decoded.width, decoded.height).coerceAtLeast(1)
            val matrix = Matrix().apply {
                if (scale < 1f) postScale(scale, scale)
                postRotate(rotation)
            }
            val upright = Bitmap.createBitmap(decoded, 0, 0, decoded.width, decoded.height, matrix, true)
            dir.mkdirs()
            dir.listFiles { f -> f.name.startsWith(resumeId) }?.forEach { it.delete() }
            val file = File(dir, "$resumeId-${System.currentTimeMillis()}.jpg")
            FileOutputStream(file).use { upright.compress(Bitmap.CompressFormat.JPEG, 88, it) }
            file.absolutePath
        }.getOrNull()
    }

    fun delete(path: String?) {
        if (path != null && path.startsWith(dir.absolutePath)) File(path).delete()
    }
}
