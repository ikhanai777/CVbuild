package com.folio.cv.data

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

enum class ThemeMode(val label: String) { SYSTEM("System"), LIGHT("Light"), DARK("Dark") }

data class AppSettings(
    val theme: ThemeMode = ThemeMode.SYSTEM,
    val dynamicColor: Boolean = false,
    val onboarded: Boolean = false,
)

/** Small user preferences. Dynamic colour is off by default to protect the design and preview fidelity. */
class SettingsRepository(context: Context) {
    private val prefs = context.getSharedPreferences("folio_settings", Context.MODE_PRIVATE)

    private val state = MutableStateFlow(
        AppSettings(
            theme = runCatching { ThemeMode.valueOf(prefs.getString("theme", null) ?: "SYSTEM") }.getOrDefault(ThemeMode.SYSTEM),
            dynamicColor = prefs.getBoolean("dynamic_color", false),
            onboarded = prefs.getBoolean("onboarded", false),
        ),
    )
    val settings: StateFlow<AppSettings> = state.asStateFlow()

    fun setTheme(mode: ThemeMode) = update(state.value.copy(theme = mode))
    fun setDynamicColor(enabled: Boolean) = update(state.value.copy(dynamicColor = enabled))
    fun setOnboarded() = update(state.value.copy(onboarded = true))

    private fun update(s: AppSettings) {
        state.value = s
        prefs.edit()
            .putString("theme", s.theme.name)
            .putBoolean("dynamic_color", s.dynamicColor)
            .putBoolean("onboarded", s.onboarded)
            .apply()
    }
}
