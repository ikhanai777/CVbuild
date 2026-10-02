package com.cvbuild.uae;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Hosts the CV builder in a WebView and supplies the three things a WebView
 * lacks: a file picker (CV import, photo upload), printing (PDF export) and
 * file saving (Word and JSON export).
 *
 * The web app is served from the APK's assets under a fixed https origin
 * rather than file://, because ES modules, workers and localStorage all need a
 * real origin. Nothing is fetched from the network — the app has no INTERNET
 * permission.
 */
public class MainActivity extends Activity {

    private static final String HOST = "appassets.androidplatform.net";
    private static final String ORIGIN = "https://" + HOST;
    private static final String ASSET_ROOT = "www";
    private static final String SAVE_FOLDER = "CVBuild";

    private static final int REQUEST_FILE = 1001;
    private static final int REQUEST_STORAGE = 1002;

    private WebView web;
    private ValueCallback<Uri[]> fileCallback;

    /** A save waiting on the storage permission (Android 9 and below only). */
    private byte[] pendingBytes;
    private String pendingName;
    private String pendingMime;

    private static final Map<String, String> MIME = new HashMap<String, String>();

    static {
        MIME.put("html", "text/html");
        MIME.put("js", "text/javascript");
        MIME.put("mjs", "text/javascript");
        MIME.put("css", "text/css");
        MIME.put("json", "application/json");
        MIME.put("svg", "image/svg+xml");
        MIME.put("png", "image/png");
        MIME.put("jpg", "image/jpeg");
        MIME.put("jpeg", "image/jpeg");
        MIME.put("webp", "image/webp");
        MIME.put("ico", "image/x-icon");
        MIME.put("woff", "font/woff");
        MIME.put("woff2", "font/woff2");
        MIME.put("ttf", "font/ttf");
        MIME.put("txt", "text/plain");
        MIME.put("wasm", "application/wasm");
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        web = new WebView(this);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setSupportMultipleWindows(false);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        s.setMediaPlaybackRequiresUserGesture(true);
        // The layout is designed in CSS pixels for phones; the system font-size
        // setting would otherwise rescale the editor and the CV page alike.
        s.setTextZoom(100);
        s.setLoadWithOverviewMode(false);
        s.setUseWideViewPort(true);
        s.setBuiltInZoomControls(false);
        s.setSupportZoom(false);

        web.addJavascriptInterface(new Bridge(), "AndroidBridge");
        web.setWebViewClient(new AssetClient());
        web.setWebChromeClient(new ChromeClient());

        if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
        } else {
            web.loadUrl(ORIGIN + "/index.html");
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }

    /* ------------------------------------------------------------------ */
    /* serving the bundled web app                                         */
    /* ------------------------------------------------------------------ */

    private class AssetClient extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri url = request.getUrl();
            if (!HOST.equals(url.getHost())) {
                // No network: anything off-origin is refused rather than fetched.
                return notFound();
            }
            return serveAsset(url.getPath());
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri url = request.getUrl();
            if (HOST.equals(url.getHost())) return false;
            // Links out (mailto:, a portfolio URL) belong in the user's own apps.
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, url));
            } catch (ActivityNotFoundException e) {
                toast("No app can open this link.");
            }
            return true;
        }
    }

    private WebResourceResponse serveAsset(String path) {
        if (path == null || path.isEmpty() || "/".equals(path)) path = "/index.html";
        if (path.contains("..")) return notFound();
        String ext = "";
        int dot = path.lastIndexOf('.');
        if (dot >= 0) ext = path.substring(dot + 1).toLowerCase(Locale.ROOT);
        String mime = MIME.containsKey(ext) ? MIME.get(ext) : "application/octet-stream";
        try {
            InputStream in = getAssets().open(ASSET_ROOT + path);
            String encoding = mime.startsWith("text/") || mime.endsWith("json") || mime.endsWith("svg+xml")
                    ? "UTF-8"
                    : null;
            WebResourceResponse response = new WebResourceResponse(mime, encoding, in);
            Map<String, String> headers = new HashMap<String, String>();
            headers.put("Access-Control-Allow-Origin", ORIGIN);
            headers.put("Cache-Control", "no-cache");
            response.setResponseHeaders(headers);
            return response;
        } catch (IOException e) {
            return notFound();
        }
    }

    private static WebResourceResponse notFound() {
        return new WebResourceResponse(
                "text/plain", "UTF-8", 404, "Not Found",
                new HashMap<String, String>(), new ByteArrayInputStream(new byte[0]));
    }

    /* ------------------------------------------------------------------ */
    /* file picker: CV import and photo upload                             */
    /* ------------------------------------------------------------------ */

    private class ChromeClient extends WebChromeClient {
        @Override
        public boolean onShowFileChooser(
                WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
            if (fileCallback != null) fileCallback.onReceiveValue(null);
            fileCallback = callback;

            boolean imagesOnly = true;
            String[] accept = params.getAcceptTypes();
            if (accept == null || accept.length == 0) imagesOnly = false;
            else {
                for (String type : accept) {
                    if (type == null || !type.trim().startsWith("image/")) imagesOnly = false;
                }
            }

            Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
            pick.addCategory(Intent.CATEGORY_OPENABLE);
            if (imagesOnly) {
                pick.setType("image/*");
            } else {
                // The import accepts PDF, Word, text and JSON. Extension filters
                // do not map cleanly onto MIME types, so offer every document and
                // let the app's own parser say what it cannot read.
                pick.setType("*/*");
                pick.putExtra(Intent.EXTRA_MIME_TYPES, new String[] {
                        "application/pdf",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        "text/plain", "text/markdown", "application/json", "application/octet-stream",
                });
            }
            try {
                startActivityForResult(
                        Intent.createChooser(pick, imagesOnly ? "Choose a photo" : "Choose your CV"),
                        REQUEST_FILE);
                return true;
            } catch (ActivityNotFoundException e) {
                fileCallback = null;
                toast("No file picker is available on this device.");
                return false;
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQUEST_FILE) {
            if (fileCallback != null) {
                fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
                fileCallback = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    /* ------------------------------------------------------------------ */
    /* the bridge the web app calls                                        */
    /* ------------------------------------------------------------------ */

    private class Bridge {
        /** PDF export: Android printing, whose "Save as PDF" keeps text selectable. */
        @JavascriptInterface
        public void print(final String jobName, final String paperSize) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    printPage(jobName, paperSize);
                }
            });
        }

        /** Word / JSON export: saves to Downloads/CVBuild and offers Open or Share. */
        @JavascriptInterface
        public void saveFile(String base64, final String fileName, final String mimeType) {
            final byte[] bytes;
            try {
                bytes = Base64.decode(base64, Base64.DEFAULT);
            } catch (IllegalArgumentException e) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        toast("The file could not be prepared.");
                    }
                });
                return;
            }
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    save(bytes, safeName(fileName), mimeType);
                }
            });
        }
    }

    private void printPage(String jobName, String paperSize) {
        PrintManager printManager = (PrintManager) getSystemService(PRINT_SERVICE);
        if (printManager == null || web == null) {
            toast("Printing is not available on this device.");
            return;
        }
        String name = jobName == null || jobName.trim().isEmpty() ? "CV" : jobName.trim();
        PrintDocumentAdapter adapter = web.createPrintDocumentAdapter(name);
        PrintAttributes attributes = new PrintAttributes.Builder()
                .setMediaSize("Letter".equals(paperSize)
                        ? PrintAttributes.MediaSize.NA_LETTER
                        : PrintAttributes.MediaSize.ISO_A4)
                .setColorMode(PrintAttributes.COLOR_MODE_COLOR)
                // The CV's own @page rule sets the margins.
                .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                .build();
        printManager.print(name, adapter, attributes);
    }

    /* ------------------------------------------------------------------ */
    /* saving to Downloads                                                 */
    /* ------------------------------------------------------------------ */

    private static String safeName(String name) {
        String clean = name == null ? "" : name.replaceAll("[\\\\/:*?\"<>|]", "-").trim();
        return clean.isEmpty() ? "CV" : clean;
    }

    private void save(byte[] bytes, String name, String mime) {
        if (Build.VERSION.SDK_INT >= 29) {
            saveWithMediaStore(bytes, name, mime);
            return;
        }
        if (checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)
                != PackageManager.PERMISSION_GRANTED) {
            pendingBytes = bytes;
            pendingName = name;
            pendingMime = mime;
            requestPermissions(new String[] {Manifest.permission.WRITE_EXTERNAL_STORAGE}, REQUEST_STORAGE);
            return;
        }
        saveToPublicDownloads(bytes, name, mime);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        if (requestCode != REQUEST_STORAGE) return;
        byte[] bytes = pendingBytes;
        String name = pendingName;
        String mime = pendingMime;
        pendingBytes = null;
        pendingName = null;
        pendingMime = null;
        if (bytes == null) return;
        if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) {
            saveToPublicDownloads(bytes, name, mime);
        } else {
            toast("Storage permission is needed to save to Downloads.");
        }
    }

    /** Android 10+: no permission needed. */
    private void saveWithMediaStore(byte[] bytes, String name, String mime) {
        ContentResolver resolver = getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
        values.put(MediaStore.MediaColumns.MIME_TYPE, mime);
        values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/" + SAVE_FOLDER);
        values.put(MediaStore.MediaColumns.IS_PENDING, 1);
        Uri uri = null;
        try {
            uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
            if (uri == null) throw new IOException("MediaStore refused the file");
            OutputStream out = resolver.openOutputStream(uri);
            if (out == null) throw new IOException("Could not open the file for writing");
            try {
                out.write(bytes);
            } finally {
                out.close();
            }
            ContentValues done = new ContentValues();
            done.put(MediaStore.MediaColumns.IS_PENDING, 0);
            resolver.update(uri, done, null, null);
            onSaved(uri, name, mime);
        } catch (Exception e) {
            if (uri != null) resolver.delete(uri, null, null);
            toast("Could not save the file: " + e.getMessage());
        }
    }

    /** Android 7–9: write the file, then let the media scanner give it a shareable URI. */
    private void saveToPublicDownloads(byte[] bytes, final String name, final String mime) {
        try {
            File dir = new File(
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), SAVE_FOLDER);
            if (!dir.exists() && !dir.mkdirs()) throw new IOException("Could not create Downloads/" + SAVE_FOLDER);
            File file = uniqueFile(dir, name);
            FileOutputStream out = new FileOutputStream(file);
            try {
                out.write(bytes);
            } finally {
                out.close();
            }
            final String savedName = file.getName();
            MediaScannerConnection.scanFile(this, new String[] {file.getAbsolutePath()}, new String[] {mime},
                    new MediaScannerConnection.OnScanCompletedListener() {
                        @Override
                        public void onScanCompleted(String path, final Uri uri) {
                            runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    if (uri != null) onSaved(uri, savedName, mime);
                                    else toast("Saved to Downloads/" + SAVE_FOLDER + "/" + savedName);
                                }
                            });
                        }
                    });
        } catch (IOException e) {
            toast("Could not save the file: " + e.getMessage());
        }
    }

    private static File uniqueFile(File dir, String name) {
        File file = new File(dir, name);
        if (!file.exists()) return file;
        int dot = name.lastIndexOf('.');
        String stem = dot > 0 ? name.substring(0, dot) : name;
        String ext = dot > 0 ? name.substring(dot) : "";
        for (int i = 2; i < 1000; i++) {
            file = new File(dir, stem + " (" + i + ")" + ext);
            if (!file.exists()) return file;
        }
        return file;
    }

    private void onSaved(final Uri uri, String name, final String mime) {
        if (isFinishing()) return;
        new AlertDialog.Builder(this)
                .setTitle("Saved")
                .setMessage(name + "\n\nSaved to Downloads/" + SAVE_FOLDER + ".")
                .setPositiveButton("Open", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        Intent view = new Intent(Intent.ACTION_VIEW);
                        view.setDataAndType(uri, mime);
                        view.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        try {
                            startActivity(Intent.createChooser(view, "Open with"));
                        } catch (ActivityNotFoundException e) {
                            toast("No app on this phone opens this file type.");
                        }
                    }
                })
                .setNeutralButton("Share", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        Intent send = new Intent(Intent.ACTION_SEND);
                        send.setType(mime);
                        send.putExtra(Intent.EXTRA_STREAM, uri);
                        send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        try {
                            startActivity(Intent.createChooser(send, "Share CV"));
                        } catch (ActivityNotFoundException e) {
                            toast("No app is available to share with.");
                        }
                    }
                })
                .setNegativeButton("Done", null)
                .show();
    }

    private void toast(String message) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show();
    }
}
