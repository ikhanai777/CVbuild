package com.folio.cv

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.folio.cv.ui.nav.FolioNavHost
import com.folio.cv.ui.theme.FolioTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        val container = (application as FolioApp).container
        setContent {
            val settings by container.settings.settings.collectAsStateWithLifecycle()
            // Decided once per launch so finishing onboarding doesn't rebuild the navigation graph.
            val onboarded = remember { container.settings.settings.value.onboarded }
            FolioTheme(mode = settings.theme, dynamicColor = settings.dynamicColor) {
                FolioNavHost(container, onboarded)
            }
        }
    }
}
