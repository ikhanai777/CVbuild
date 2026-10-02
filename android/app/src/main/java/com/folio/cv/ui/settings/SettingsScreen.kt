@file:OptIn(ExperimentalMaterial3Api::class)

package com.folio.cv.ui.settings

import android.os.Build
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.folio.cv.BuildConfig
import com.folio.cv.data.SettingsRepository
import com.folio.cv.data.ThemeMode
import com.folio.cv.ui.components.FolioCard
import com.folio.cv.ui.components.SectionLabel
import com.folio.cv.ui.theme.Folio

@Composable
fun SettingsScreen(settings: SettingsRepository, onBack: () -> Unit) {
    val s by settings.settings.collectAsStateWithLifecycle()
    Scaffold(
        containerColor = Folio.colors.background,
        topBar = {
            CenterAlignedTopAppBar(
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(containerColor = Folio.colors.background),
                title = { Text("Settings", style = MaterialTheme.typography.titleMedium) },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back") }
                },
            )
        },
    ) { padding ->
        LazyColumn(
            Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
        ) {
            item { SectionLabel("Appearance") }
            item {
                FolioCard(Modifier.fillMaxWidth()) {
                    Column {
                        ThemeMode.entries.forEachIndexed { i, mode ->
                            if (i > 0) HorizontalDivider(color = Folio.colors.separator, modifier = Modifier.padding(start = 16.dp))
                            Surface(onClick = { settings.setTheme(mode) }, color = Color.Transparent) {
                                Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Text(mode.label, style = MaterialTheme.typography.bodyLarge, color = Folio.colors.ink, modifier = Modifier.weight(1f))
                                    RadioButton(
                                        selected = s.theme == mode,
                                        onClick = { settings.setTheme(mode) },
                                        colors = RadioButtonDefaults.colors(selectedColor = Folio.colors.accent),
                                    )
                                }
                            }
                        }
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                            HorizontalDivider(color = Folio.colors.separator, modifier = Modifier.padding(start = 16.dp))
                            Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Text("Wallpaper colours", style = MaterialTheme.typography.bodyLarge, color = Folio.colors.ink)
                                    Text("Tint the app with Material You. Your CV is unaffected.", style = MaterialTheme.typography.bodySmall, color = Folio.colors.secondary)
                                }
                                Switch(
                                    checked = s.dynamicColor,
                                    onCheckedChange = settings::setDynamicColor,
                                    colors = SwitchDefaults.colors(checkedTrackColor = Folio.colors.accent),
                                )
                            }
                        }
                    }
                }
            }
            item { SectionLabel("Privacy") }
            item {
                FolioCard(Modifier.fillMaxWidth()) {
                    Text(
                        "Folio has no account and no servers. Your CVs live only on this device, in private app storage, " +
                            "and are included in your Android device backup. Nothing is shared unless you export it.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Folio.colors.ink,
                        modifier = Modifier.padding(16.dp),
                    )
                }
            }
            item { SectionLabel("About") }
            item {
                FolioCard(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(16.dp)) {
                        Text("Folio ${BuildConfig.VERSION_NAME}", style = MaterialTheme.typography.titleSmall, color = Folio.colors.ink)
                        Spacer(Modifier.height(4.dp))
                        Text(
                            "Typefaces: Inter, IBM Plex Sans and Mono, EB Garamond, Source Serif 4, Fraunces, Manrope, DM Sans, " +
                                "Space Grotesk and JetBrains Mono, all under the SIL Open Font License 1.1.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Folio.colors.secondary,
                        )
                    }
                }
            }
        }
    }
}
