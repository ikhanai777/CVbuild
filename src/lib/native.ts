/**
 * The Android app shell.
 *
 * Inside the Android app the CV runs in a WebView, where the browser features
 * the exporters rely on do not exist: `window.print()` is a no-op, and an
 * `<a download>` click on a blob URL goes nowhere. The app's native code
 * injects `window.AndroidBridge` to stand in for both — printing through
 * Android's print framework (whose "Save as PDF" keeps text selectable, exactly
 * like the browser path) and saving files to Downloads with Open/Share.
 *
 * In a browser the bridge is absent and every caller falls back to the web
 * behaviour, so the same build serves both.
 */

interface AndroidBridge {
  /** Opens the system print dialog for the current page's print rendering. */
  print(jobName: string, paperSize: string): void;
  /** Saves base64 content to Downloads/CVBuild and offers Open / Share. */
  saveFile(base64: string, fileName: string, mimeType: string): void;
}

declare global {
  interface Window {
    AndroidBridge?: AndroidBridge;
  }
}

export function androidBridge(): AndroidBridge | null {
  return typeof window !== 'undefined' && window.AndroidBridge ? window.AndroidBridge : null;
}

export function isAndroidApp(): boolean {
  return androidBridge() !== null;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      resolve(url.slice(url.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file.'));
    reader.readAsDataURL(blob);
  });
}

/** Saves a generated file: to Downloads in the app, as a browser download otherwise. */
export async function saveBlob(blob: Blob, fileName: string): Promise<void> {
  const bridge = androidBridge();
  if (bridge) {
    bridge.saveFile(await blobToBase64(blob), fileName, blob.type || 'application/octet-stream');
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
