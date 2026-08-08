package com.cambodia.lawlibrary;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;

import androidx.core.content.FileProvider;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;

@CapacitorPlugin(name = "NativePdfViewer")
public class NativePdfViewerPlugin extends Plugin {

    @PluginMethod
    public void openPdf(PluginCall call) {
        String filename = call.getString("filename");
        if (filename == null || filename.isEmpty()) {
            call.reject("Filename is required");
            return;
        }

        try {
            Context context = getContext();
            File cacheDir = context.getExternalCacheDir();
            if (cacheDir == null) cacheDir = context.getCacheDir();

            File pdfFile = new File(cacheDir, filename);

            // Copy from assets/public/pdfs to cache directory for FileProvider Uri
            String assetPath = "public/pdfs/" + filename;
            InputStream is = context.getAssets().open(assetPath);
            FileOutputStream fos = new FileOutputStream(pdfFile);

            byte[] buffer = new byte[8192];
            int read;
            while ((read = is.read(buffer)) != -1) {
                fos.write(buffer, 0, read);
            }
            fos.flush();
            fos.close();
            is.close();

            Uri pdfUri = FileProvider.getUriForFile(
                    context,
                    context.getPackageName() + ".fileprovider",
                    pdfFile
            );

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(pdfUri, "application/pdf");
            intent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            Intent chooser = Intent.createChooser(intent, "បើកឯកសារ PDF តាមកម្មវិធី");
            chooser.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(chooser);

            call.resolve();

        } catch (Exception e) {
            e.printStackTrace();
            call.reject("Failed to open native PDF viewer: " + e.getMessage());
        }
    }
}
