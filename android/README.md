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

## Releasing to Google Play

Package `com.folio.cv`, version 1 ("1.0"), target and compile SDK 36. Release builds are
shrunk with R8, resource-shrunk and non-debuggable. The app ships no native libraries, and CI
checks every build for 16 KB page-size support (`scripts/check-16kb.sh`).

**Upload key.** Create it once, on your own machine, and keep it and its passwords safe
(RSA 4096, valid for about 27 years):

```bash
keytool -genkeypair -v -keystore upload-keystore.jks -alias upload \
  -keyalg RSA -keysize 4096 -validity 10000
```

**Signing locally.** Put `upload-keystore.jks` in `android/`, copy `keystore.properties.example`
to `keystore.properties` and fill it in. Both files are git-ignored. Then run
`./gradlew bundleRelease`; the bundle is `app/build/outputs/bundle/release/app-release.aab`.

**Signing in CI.** Add four repository secrets and every push builds the signed bundle as the
`folio-play-bundle` artifact:

```bash
base64 -w0 upload-keystore.jks | gh secret set UPLOAD_KEYSTORE_BASE64   # macOS: base64 -i upload-keystore.jks
gh secret set UPLOAD_KEYSTORE_PASSWORD
gh secret set UPLOAD_KEY_ALIAS        # upload
gh secret set UPLOAD_KEY_PASSWORD
```
