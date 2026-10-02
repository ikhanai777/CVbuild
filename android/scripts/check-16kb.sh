#!/usr/bin/env bash
# Checks an APK or AAB for Android 15+ 16 KB page-size support: every 64-bit native library
# must have ELF LOAD segments aligned to at least 16 KB. Exits non-zero on any failure.
set -euo pipefail
archive="$1"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
unzip -q "$archive" -d "$work"
mapfile -t libs < <(find "$work" -name '*.so' \( -path '*arm64-v8a*' -o -path '*x86_64*' \) | sort)
if [ "${#libs[@]}" -eq 0 ]; then
  echo "16 KB check: $(basename "$archive") has no 64-bit native libraries, so it is compatible."
  exit 0
fi
failed=0
for lib in "${libs[@]}"; do
  align=$(readelf -lW "$lib" | awk '$1 == "LOAD" { print $NF }' | sort -u | head -n1)
  if [ $((align)) -ge $((0x4000)) ]; then
    echo "OK    ${lib#"$work"/}  (align $align)"
  else
    echo "FAIL  ${lib#"$work"/}  (align $align, needs 0x4000)"
    failed=1
  fi
done
exit $failed
