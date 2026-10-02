#!/usr/bin/env bash
# Builds a signed, installable APK of CVBuild UAE: android/dist/CVBuild-UAE.apk
#
# No Gradle and no full Android SDK: the app is one Activity with no
# dependencies, so the platform tools are enough. Needs:
#   - JDK 17+ (javac, keytool)
#   - aapt, dalvik-exchange (dx), zipalign, apksigner
#       Ubuntu/Debian: apt install aapt dalvik-exchange zipalign apksigner
#   - an android.jar for API 34, in $ANDROID_JAR
#       e.g. the platform jar from an Android SDK (platforms/android-34/android.jar)
#   - Python 3 with Pillow (launcher icons)
#
# Signing: set KEYSTORE, KEYSTORE_PASS and KEY_ALIAS to sign with your own key.
# Without them a local key is generated in android/.signing/ (gitignored). Keep
# that file: Android only installs an update over an existing app when both are
# signed with the same key.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
BUILD="$HERE/build"
OUT="$HERE/dist"
ANDROID_JAR="${ANDROID_JAR:?Set ANDROID_JAR to an API 34 android.jar}"
DX="$(command -v dalvik-exchange || command -v dx)"

echo "› Building the web app"
(cd "$ROOT" && npm run build >/dev/null)

echo "› Preparing"
rm -rf "$BUILD"
mkdir -p "$BUILD/assets/www" "$BUILD/gen" "$BUILD/classes" "$OUT"
cp -R "$ROOT/dist/." "$BUILD/assets/www/"
rm -f "$BUILD/assets/www/artifact.html"
python3 "$HERE/make-icons.py" "$HERE/res" >/dev/null

echo "› Compiling resources"
aapt package -f -m -J "$BUILD/gen" -M "$HERE/AndroidManifest.xml" -S "$HERE/res" -I "$ANDROID_JAR"

echo "› Compiling Java"
find "$HERE/src" "$BUILD/gen" -name '*.java' > "$BUILD/sources.txt"
javac -nowarn -Xlint:-options -source 8 -target 8 -encoding UTF-8 \
  -bootclasspath "$ANDROID_JAR" -classpath "$ANDROID_JAR" \
  -d "$BUILD/classes" @"$BUILD/sources.txt"

echo "› Dexing"
"$DX" --dex --min-sdk-version=24 --output="$BUILD/classes.dex" "$BUILD/classes"

echo "› Packaging"
# Fonts, images and the pdf.js worker are stored uncompressed (-0) so the
# WebView can stream them straight out of the APK.
aapt package -f -M "$HERE/AndroidManifest.xml" -S "$HERE/res" -A "$BUILD/assets" -I "$ANDROID_JAR" \
  -0 woff2 -0 woff -0 png -0 jpg \
  -F "$BUILD/app-unsigned.apk"
(cd "$BUILD" && aapt add -f app-unsigned.apk classes.dex >/dev/null)
zipalign -f -p 4 "$BUILD/app-unsigned.apk" "$BUILD/app-aligned.apk"

echo "› Signing"
if [ -z "${KEYSTORE:-}" ]; then
  KEYSTORE="$HERE/.signing/cvbuild-uae.jks"
  KEY_ALIAS="cvbuild"
  if [ ! -f "$KEYSTORE" ]; then
    mkdir -p "$HERE/.signing"
    KEYSTORE_PASS="$(head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 24)"
    printf '%s' "$KEYSTORE_PASS" > "$HERE/.signing/password.txt"
    keytool -genkeypair -noprompt -keystore "$KEYSTORE" -storepass "$KEYSTORE_PASS" -keypass "$KEYSTORE_PASS" \
      -alias "$KEY_ALIAS" -keyalg RSA -keysize 2048 -validity 10000 \
      -dname "CN=CVBuild UAE, O=CVBuild, C=AE" >/dev/null 2>&1
    echo "  generated a signing key in android/.signing/ — keep it to publish updates"
  fi
  KEYSTORE_PASS="${KEYSTORE_PASS:-$(cat "$HERE/.signing/password.txt")}"
fi
VERSION="$(sed -n 's/.*android:versionName="\([^"]*\)".*/\1/p' "$HERE/AndroidManifest.xml")"
APK="$OUT/CVBuild-UAE-$VERSION.apk"
apksigner sign --ks "$KEYSTORE" --ks-pass "pass:$KEYSTORE_PASS" --ks-key-alias "${KEY_ALIAS:-cvbuild}" \
  --min-sdk-version 24 --out "$APK" "$BUILD/app-aligned.apk"
apksigner verify "$APK"

echo "✓ $APK ($(du -h "$APK" | cut -f1))"
