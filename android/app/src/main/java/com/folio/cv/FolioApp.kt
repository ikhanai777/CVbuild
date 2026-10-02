package com.folio.cv

import android.app.Application
import com.folio.cv.data.PhotoStore
import com.folio.cv.data.ResumeRepository
import com.folio.cv.data.SettingsRepository
import com.folio.cv.render.DocumentLayout
import com.folio.cv.render.FontRegistry
import com.folio.cv.render.ImageCache
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import java.io.File

/** Manual dependency container: a handful of app-wide singletons, no reflection, no codegen. */
class AppContainer(app: Application) {
    val appScope = CoroutineScope(SupervisorJob())
    val resumes = ResumeRepository(File(app.filesDir, "resumes"), appScope)
    val settings = SettingsRepository(app)
    val photos = PhotoStore(app)
    val fonts = FontRegistry(app)
    val layout = DocumentLayout(fonts)
    val images = ImageCache()
}

class FolioApp : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
