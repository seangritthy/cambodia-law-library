package com.cambodia.lawlibrary;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "AppUpdater")
public class AppUpdaterPlugin extends Plugin {

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String apkUrl = call.getString("url");
        if (apkUrl == null || apkUrl.isEmpty()) {
            call.reject("URL is required");
            return;
        }

        new Thread(() -> {
            try {
                Context context = getContext();
                URL url = new URL(apkUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
                conn.setInstanceFollowRedirects(true);
                conn.connect();

                int status = conn.getResponseCode();
                if (status == HttpURLConnection.HTTP_MOVED_TEMP || status == HttpURLConnection.HTTP_MOVED_PERM || status == 307 || status == 308) {
                    String newUrl = conn.getHeaderField("Location");
                    if (newUrl != null && !newUrl.isEmpty()) {
                        conn = (HttpURLConnection) new URL(newUrl).openConnection();
                        conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
                        conn.connect();
                    }
                }

                int contentLength = conn.getContentLength();
                InputStream input = conn.getInputStream();

                File cacheDir = context.getExternalCacheDir();
                if (cacheDir == null) cacheDir = context.getCacheDir();
                File apkFile = new File(cacheDir, "update.apk");
                if (apkFile.exists()) apkFile.delete();

                FileOutputStream output = new FileOutputStream(apkFile);
                byte[] buffer = new byte[8192];
                int bytesRead;
                long totalBytes = 0;
                long lastProgressTime = 0;

                while ((bytesRead = input.read(buffer)) != -1) {
                    totalBytes += bytesRead;
                    output.write(buffer, 0, bytesRead);

                    long currentTime = System.currentTimeMillis();
                    if (contentLength > 0 && currentTime - lastProgressTime > 200) {
                        lastProgressTime = currentTime;
                        int progress = (int) ((totalBytes * 100) / contentLength);
                        JSObject progressData = new JSObject();
                        progressData.put("progress", progress);
                        progressData.put("downloaded", totalBytes);
                        progressData.put("total", contentLength);
                        notifyListeners("downloadProgress", progressData);
                    }
                }

                output.flush();
                output.close();
                input.close();

                // Final 100% notification
                JSObject progressData = new JSObject();
                progressData.put("progress", 100);
                progressData.put("downloaded", totalBytes);
                progressData.put("total", totalBytes);
                notifyListeners("downloadProgress", progressData);

                // Trigger Android APK Package Installer Intent
                Intent intent = new Intent(Intent.ACTION_VIEW);
                Uri apkUri = FileProvider.getUriForFile(
                        context,
                        context.getPackageName() + ".fileprovider",
                        apkFile
                );
                intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

                context.startActivity(intent);

                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);

            } catch (Exception e) {
                e.printStackTrace();
                call.reject("Download/Install error: " + e.getMessage());
            }
        }).start();
    }
}
