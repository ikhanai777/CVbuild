@file:OptIn(ExperimentalMaterial3Api::class)

package com.folio.cv.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.folio.cv.render.ImageCache
import com.folio.cv.render.LaidOutDocument
import com.folio.cv.ui.theme.Folio

/** Draws one laid-out page as vectors, scaled to the available width. Identical to the PDF. */
@Composable
fun PageCanvas(
    document: LaidOutDocument,
    pageIndex: Int,
    images: ImageCache,
    modifier: Modifier = Modifier,
    elevation: Dp = 0.dp,
    corner: Dp = 2.dp,
) {
    val shape = RoundedCornerShape(corner)
    Canvas(
        modifier
            .aspectRatio(document.widthPt / document.heightPt)
            .shadow(elevation, shape, clip = false, ambientColor = Color.Black.copy(alpha = 0.06f), spotColor = Color.Black.copy(alpha = 0.12f))
            .clip(shape)
            .background(Color.White)
            .semantics { contentDescription = "CV page ${pageIndex + 1}" },
    ) {
        val scale = size.width / document.widthPt
        drawIntoCanvas { canvas ->
            val native = canvas.nativeCanvas
            native.save()
            native.scale(scale, scale)
            document.drawPage(native, pageIndex, images)
            native.restore()
        }
    }
}

/** The one primary action on a screen: a full-width pill. */
@Composable
fun PillButton(text: String, onClick: () -> Unit, modifier: Modifier = Modifier, icon: ImageVector? = null, enabled: Boolean = true) {
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.height(52.dp),
        shape = CircleShape,
        colors = ButtonDefaults.buttonColors(containerColor = Folio.colors.accent, contentColor = Color.White),
        contentPadding = PaddingValues(horizontal = 28.dp),
    ) {
        if (icon != null) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(20.dp))
            Spacer(Modifier.size(8.dp))
        }
        Text(text, style = MaterialTheme.typography.labelLarge)
    }
}

@Composable
fun QuietButton(text: String, onClick: () -> Unit, modifier: Modifier = Modifier, color: Color = Folio.colors.accent) {
    TextButton(onClick = onClick, modifier = modifier) {
        Text(text, style = MaterialTheme.typography.labelLarge, color = color)
    }
}

/** Calm text field: hairline outline, label above, optional hint underneath. */
@Composable
fun FolioField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    hint: String? = null,
    error: String? = null,
    singleLine: Boolean = true,
    minLines: Int = 1,
    keyboardType: KeyboardType = KeyboardType.Text,
    capitalization: KeyboardCapitalization = KeyboardCapitalization.Sentences,
) {
    Column(modifier.fillMaxWidth()) {
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            label = { Text(label) },
            placeholder = if (placeholder != null) {
                { Text(placeholder, color = Folio.colors.secondary.copy(alpha = 0.7f)) }
            } else {
                null
            },
            singleLine = singleLine,
            minLines = minLines,
            isError = error != null,
            keyboardOptions = KeyboardOptions(capitalization = capitalization, keyboardType = keyboardType),
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Folio.colors.accent,
                unfocusedBorderColor = Folio.colors.separator,
                focusedLabelColor = Folio.colors.accent,
                unfocusedLabelColor = Folio.colors.secondary,
                cursorColor = Folio.colors.accent,
            ),
            modifier = Modifier.fillMaxWidth(),
        )
        val note = error ?: hint
        if (note != null) {
            Text(
                note,
                style = MaterialTheme.typography.bodySmall,
                color = if (error != null) Folio.colors.destructive else Folio.colors.secondary,
                modifier = Modifier.padding(start = 4.dp, top = 4.dp),
            )
        }
    }
}

/** A rounded card on the secondary surface: the only container style in the app. */
@Composable
fun FolioCard(modifier: Modifier = Modifier, onClick: (() -> Unit)? = null, content: @Composable () -> Unit) {
    if (onClick != null) {
        Surface(onClick = onClick, modifier = modifier, shape = RoundedCornerShape(16.dp), color = Folio.colors.surface) {
            content()
        }
    } else {
        Surface(modifier = modifier, shape = RoundedCornerShape(16.dp), color = Folio.colors.surface) { content() }
    }
}

@Composable
fun SectionLabel(text: String, modifier: Modifier = Modifier) {
    Text(
        text.uppercase(),
        style = MaterialTheme.typography.labelSmall,
        color = Folio.colors.secondary,
        modifier = modifier.padding(start = 4.dp, bottom = 8.dp, top = 8.dp),
    )
}

@Composable
fun Swatch(color: Color, selected: Boolean, onClick: () -> Unit, label: String) {
    Box(
        Modifier
            .size(40.dp)
            .clip(CircleShape)
            .clickable(onClickLabel = label, onClick = onClick)
            .semantics { contentDescription = if (selected) "$label, selected" else label }
            .border(2.dp, if (selected) Folio.colors.ink else Color.Transparent, CircleShape)
            .padding(5.dp)
            .clip(CircleShape)
            .background(color),
    )
}

@Composable
fun EmptyState(title: String, body: String, action: String, onAction: () -> Unit, modifier: Modifier = Modifier) {
    Column(modifier.padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        Text(title, style = MaterialTheme.typography.headlineSmall, color = Folio.colors.ink)
        Spacer(Modifier.height(8.dp))
        Text(body, style = MaterialTheme.typography.bodyMedium, color = Folio.colors.secondary)
        Spacer(Modifier.height(24.dp))
        PillButton(action, onAction)
    }
}
