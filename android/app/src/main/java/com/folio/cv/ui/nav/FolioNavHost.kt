package com.folio.cv.ui.nav

import androidx.compose.animation.core.spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.IntOffset
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.folio.cv.AppContainer
import com.folio.cv.ui.editor.EditorScreen
import com.folio.cv.ui.editor.EditorViewModel
import com.folio.cv.ui.home.HomeScreen
import com.folio.cv.ui.home.HomeViewModel
import com.folio.cv.ui.preview.PreviewScreen
import com.folio.cv.ui.preview.PreviewViewModel
import com.folio.cv.ui.settings.SettingsScreen
import com.folio.cv.ui.templates.TemplateGalleryScreen
import com.folio.cv.ui.templates.TemplatesViewModel
import com.folio.cv.ui.welcome.WelcomeScreen

private object Routes {
    const val WELCOME = "welcome"
    const val HOME = "home?new={new}"
    const val EDITOR = "editor/{id}"
    const val TEMPLATES = "templates/{id}"
    const val PREVIEW = "preview/{id}"
    const val SETTINGS = "settings"

    fun home(new: Boolean = false) = "home?new=$new"
    fun editor(id: String) = "editor/$id"
    fun templates(id: String) = "templates/$id"
    fun preview(id: String) = "preview/$id"
}

@Composable
fun FolioNavHost(container: AppContainer, onboarded: Boolean) {
    val nav = rememberNavController()
    val motion = spring<IntOffset>(dampingRatio = 0.9f, stiffness = 500f)
    val idArg = listOf(navArgument("id") { type = NavType.StringType })

    NavHost(
        navController = nav,
        startDestination = if (onboarded) Routes.HOME else Routes.WELCOME,
        enterTransition = { slideInHorizontally(motion) { it / 5 } + fadeIn() },
        exitTransition = { slideOutHorizontally(motion) { -it / 10 } + fadeOut() },
        popEnterTransition = { slideInHorizontally(motion) { -it / 10 } + fadeIn() },
        popExitTransition = { slideOutHorizontally(motion) { it / 5 } + fadeOut() },
    ) {
        composable(Routes.WELCOME) {
            WelcomeScreen(onStart = {
                container.settings.setOnboarded()
                nav.navigate(Routes.home(new = true)) { popUpTo(Routes.WELCOME) { inclusive = true } }
            })
        }
        composable(Routes.HOME, arguments = listOf(navArgument("new") { type = NavType.BoolType; defaultValue = false })) { entry ->
            val vm: HomeViewModel = viewModel { HomeViewModel(container) }
            HomeScreen(
                container = container,
                vm = vm,
                openEditor = { nav.navigate(Routes.editor(it)) },
                openSettings = { nav.navigate(Routes.SETTINGS) },
                startWithNewSheet = entry.arguments?.getBoolean("new") ?: false,
            )
        }
        composable(Routes.EDITOR, arguments = idArg) { entry ->
            val id = entry.arguments?.getString("id").orEmpty()
            val vm: EditorViewModel = viewModel { EditorViewModel(container, id) }
            EditorScreen(
                container = container,
                vm = vm,
                onBack = { nav.popBackStack() },
                openPreview = { nav.navigate(Routes.preview(id)) },
                openTemplates = {
                    vm.flush()
                    nav.navigate(Routes.templates(id))
                },
            )
        }
        composable(Routes.TEMPLATES, arguments = idArg) { entry ->
            val id = entry.arguments?.getString("id").orEmpty()
            val vm: TemplatesViewModel = viewModel { TemplatesViewModel(container, id) }
            TemplateGalleryScreen(vm, onBack = { nav.popBackStack() })
        }
        composable(Routes.PREVIEW, arguments = idArg) { entry ->
            val id = entry.arguments?.getString("id").orEmpty()
            val vm: PreviewViewModel = viewModel { PreviewViewModel(container, id) }
            PreviewScreen(vm, onBack = { nav.popBackStack() }, openTemplates = { nav.navigate(Routes.templates(id)) })
        }
        composable(Routes.SETTINGS) {
            SettingsScreen(container.settings, onBack = { nav.popBackStack() })
        }
    }
}
