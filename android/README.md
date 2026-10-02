# Folio for Android

A native CV builder: Kotlin, Jetpack Compose and Material 3, offline-first, no account.
Write once, pick from 27 templates (six built for mechanical engineers), and export a
vector PDF with real, selectable text.

## Build

```bash
cd android
./gradlew testDebugUnitTest   # JVM unit tests
./gradlew assembleDebug       # app/build/outputs/apk/debug/app-debug.apk
```

Requires JDK 17 and the Android SDK (compileSdk 35). Open the `android/` folder in Android Studio
to run it on a device. CI (`.github/workflows/android.yml`) builds debug and release APKs on every
push that touches `android/` and uploads them as the `folio-apks` artifact.

## What's inside

| Area | Where |
| --- | --- |
| CV model, dates, edits, starter content | `model/` |
| Template specs (27, data-driven) | `template/Templates.kt`, `template/DesignedTemplates.kt` |
| Layout engine: columns, headings, page breaks | `render/DocumentLayout.kt` |
| PDF export and printing | `render/PdfExporter.kt` |
| CV check (ATS and writing review) | `analysis/CvChecker.kt` |
| Storage (atomic JSON files), JSON Resume import/export | `data/` |
| Screens | `ui/` |

The preview and the PDF draw the same laid-out pages with the same bundled fonts, so what you
see is exactly what you export.

### Templates

| Template | Category | Layout |
| --- | --- | --- |
| Cupertino | Minimal | Single column, the default |
| Infinite Loop | Minimal | Split header, ruled headings |
| Palo Alto | Minimal | Left sidebar, photo |
| Mono | Minimal | Monospaced details |
| Ivy | Classic | Centred serif |
| Graphite | Classic | Dark header band, right sidebar |
| Editorial | Creative | Oversized serif name |
| Atelier | Creative | Timeline dates, photo |
| Tolerance | Engineering | Drawing-sheet border, title-block header |
| Torque | Engineering | Technical toolkit sidebar (CAD, CAE, manufacturing) |
| Chartered | Engineering | Serif, for PE / CEng credentials |
| Datum | Engineering | Spec-sheet numbering, dates on a datum line |
| Portrait | Modern | Ringed photo beside the name, ruled two columns, icon contacts |
| Atrium | Modern | Full-height grey sidebar with photo, two-weight name |
| Midnight | Modern | Navy sidebar with photo, connected timeline |
| Sloane | Modern | Charcoal sidebar on the right |
| Harbor | Modern | Teal header band with photo, timeline |
| Sage | Modern | Pale green sidebar with photo |
| Atlas | Modern | Rounded photo, ruled headings, margin dates |
| Linea | Minimal | Thin wide-set capitals, full-width summary, timeline |
| Clarity | Minimal | ATS-first single column with icon contacts |
| Meridian | Classic | Centred, light capitals, optional portrait |
| Linen | Classic | Garamond with a ruled side column |
| Noir | Creative | Black header band, two-weight name |
| Studio | Creative | Blush side panel, rounded portrait, timeline |
| Kepler | Engineering | Steel sidebar for toolkit and credentials, timeline |
| Gauge | Engineering | Single column, icon contacts, optional headshot |

Fonts are bundled under the SIL Open Font License 1.1.
