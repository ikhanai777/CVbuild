package com.folio.cv.ui.welcome

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.background
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.folio.cv.ui.components.PillButton
import com.folio.cv.ui.theme.Folio

/** One screen, one sentence, one button. */
@Composable
fun WelcomeScreen(onStart: () -> Unit) {
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { visible = true }
    Column(
        Modifier
            .fillMaxSize()
            .background(Folio.colors.background)
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = 32.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.Bottom,
    ) {
        AnimatedVisibility(
            visible = visible,
            enter = fadeIn(spring(stiffness = 120f)) + slideInVertically(spring(dampingRatio = 0.85f, stiffness = 120f)) { it / 6 },
        ) {
            Column {
                Text("Folio", style = MaterialTheme.typography.labelLarge, color = Folio.colors.accent)
                Spacer(Modifier.height(12.dp))
                Text(
                    "Your career,\nbeautifully told.",
                    style = MaterialTheme.typography.displaySmall,
                    color = Folio.colors.ink,
                )
                Spacer(Modifier.height(16.dp))
                Text(
                    "Write once. Choose from 27 designer templates, including six made for engineers. " +
                        "Export a PDF recruiters and their software can read.",
                    style = MaterialTheme.typography.bodyLarge,
                    color = Folio.colors.secondary,
                )
                Spacer(Modifier.height(40.dp))
                PillButton("Create your CV", onStart, Modifier.fillMaxWidth())
                Spacer(Modifier.height(12.dp))
                Text(
                    "No account. Your CV stays on this device.",
                    style = MaterialTheme.typography.bodySmall,
                    color = Folio.colors.secondary,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}
