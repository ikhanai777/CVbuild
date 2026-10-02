package com.folio.cv.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.folio.cv.R
import com.folio.cv.data.ThemeMode

/** Folio's tokens: pure surfaces, one accent, quiet secondary ink. */
@Immutable
data class FolioColors(
    val background: Color,
    val surface: Color,
    val ink: Color,
    val secondary: Color,
    val separator: Color,
    val accent: Color,
    val destructive: Color,
    val canvas: Color,
)

private val Light = FolioColors(
    background = Color(0xFFFFFFFF),
    surface = Color(0xFFF5F5F7),
    ink = Color(0xFF1D1D1F),
    secondary = Color(0xFF6E6E73),
    separator = Color(0xFFD2D2D7),
    accent = Color(0xFF0071E3),
    destructive = Color(0xFFD70015),
    canvas = Color(0xFFF0F0F2),
)

private val Dark = FolioColors(
    background = Color(0xFF000000),
    surface = Color(0xFF1C1C1E),
    ink = Color(0xFFF5F5F7),
    secondary = Color(0xFF98989D),
    separator = Color(0xFF38383A),
    accent = Color(0xFF2997FF),
    destructive = Color(0xFFFF453A),
    canvas = Color(0xFF121214),
)

val LocalFolioColors = staticCompositionLocalOf { Light }

object Folio {
    val colors: FolioColors @Composable get() = LocalFolioColors.current
}

val Inter = FontFamily(
    Font(R.font.inter_regular, FontWeight.Normal),
    Font(R.font.inter_medium, FontWeight.Medium),
    Font(R.font.inter_semibold, FontWeight.SemiBold),
    Font(R.font.inter_bold, FontWeight.Bold),
)

private fun style(size: Int, weight: FontWeight, tracking: Double, lineHeight: Int) = TextStyle(
    fontFamily = Inter,
    fontWeight = weight,
    fontSize = size.sp,
    letterSpacing = tracking.em,
    lineHeight = lineHeight.sp,
)

/** Large title 34 / Title 22 / Headline 17 / Body 17 / Callout 15 / Footnote 13 / Caption 12. */
private val FolioTypography = Typography(
    displaySmall = style(34, FontWeight.Bold, -0.022, 41),
    headlineMedium = style(28, FontWeight.Bold, -0.02, 34),
    headlineSmall = style(22, FontWeight.SemiBold, -0.015, 28),
    titleLarge = style(20, FontWeight.SemiBold, -0.012, 25),
    titleMedium = style(17, FontWeight.SemiBold, -0.01, 22),
    titleSmall = style(15, FontWeight.SemiBold, -0.005, 20),
    bodyLarge = style(17, FontWeight.Normal, -0.01, 24),
    bodyMedium = style(15, FontWeight.Normal, -0.005, 21),
    bodySmall = style(13, FontWeight.Normal, 0.0, 18),
    labelLarge = style(15, FontWeight.SemiBold, -0.005, 20),
    labelMedium = style(13, FontWeight.Medium, 0.0, 18),
    labelSmall = style(12, FontWeight.Medium, 0.01, 16),
)

private val FolioShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(10.dp),
    medium = RoundedCornerShape(12.dp),
    large = RoundedCornerShape(16.dp),
    extraLarge = RoundedCornerShape(24.dp),
)

private fun scheme(c: FolioColors, dark: Boolean): ColorScheme {
    val base = if (dark) darkColorScheme() else lightColorScheme()
    return base.copy(
        primary = c.accent,
        onPrimary = Color.White,
        primaryContainer = c.accent.copy(alpha = 0.12f),
        onPrimaryContainer = c.accent,
        secondary = c.ink,
        onSecondary = c.background,
        secondaryContainer = c.surface,
        onSecondaryContainer = c.ink,
        background = c.background,
        onBackground = c.ink,
        surface = c.background,
        onSurface = c.ink,
        surfaceVariant = c.surface,
        onSurfaceVariant = c.secondary,
        surfaceContainerLowest = c.background,
        surfaceContainerLow = c.surface,
        surfaceContainer = c.surface,
        surfaceContainerHigh = c.surface,
        surfaceContainerHighest = c.surface,
        outline = c.separator,
        outlineVariant = c.separator,
        error = c.destructive,
        scrim = Color.Black.copy(alpha = 0.32f),
    )
}

@Composable
fun FolioTheme(mode: ThemeMode = ThemeMode.SYSTEM, dynamicColor: Boolean = false, content: @Composable () -> Unit) {
    val dark = when (mode) {
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
    }
    val colors = if (dark) Dark else Light
    val colorScheme = if (dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val context = LocalContext.current
        if (dark) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
    } else {
        scheme(colors, dark)
    }
    val effective = if (dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) colors.copy(accent = colorScheme.primary) else colors
    CompositionLocalProvider(LocalFolioColors provides effective) {
        MaterialTheme(colorScheme = colorScheme, typography = FolioTypography, shapes = FolioShapes, content = content)
    }
}
