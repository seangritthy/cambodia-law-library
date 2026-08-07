# 🚀 Release & Deployment Guide - Cambodia Law Library

This guide provides instructions for releasing **Cambodia Law Library (បណ្ណាល័យច្បាប់កម្ពុជា)** as a **Web Application** or a **Native Android Mobile App (.apk / .aab)**.

---

## 1. 🌐 Web Release (GitHub Pages / Vercel / Netlify)

### Automatic GitHub Pages Deployment
1. Push your latest code changes to `main` branch:
   ```bash
   git add .
   git commit -m "Release v1.1.0 update"
   git push origin main
   ```
2. The GitHub Actions workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) will automatically build and publish the live web app to GitHub Pages.
3. Access your live app at `https://<username>.github.io/cambodia-law-library/`.

### Manual Web Hosting (Vercel / Netlify / Hostinger)
- Point your root web directory to `src/`.
- Entry point: `src/index.html`.

---

## 2. 📱 Android APK Release (Native Mobile Build)

### Prerequisites
- Node.js & npm installed
- Android Studio & Java Development Kit (JDK 17+)

### Step-by-step Android Build Instructions:

1. **Sync Web Assets with Capacitor**:
   ```bash
   npx cap sync android
   ```

2. **Generate Signed Release APK (Gradle CLI)**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   *The generated APK file will be located at:*
   `android/app/build/outputs/apk/release/app-release-unsigned.apk`

3. **Generate App Bundle (.aab) for Google Play Store**:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
   *The generated AAB file will be located at:*
   `android/app/build/outputs/bundle/release/app-release.aab`

4. **Open & Run in Android Studio**:
   ```bash
   npx cap open android
   ```
   From Android Studio menu, click **Build** > **Generate Signed Bundle / APK**.

---

## 📋 Release Checklist
- [x] Responsive Khmer typography (Kantumruy Pro & Moul fonts)
- [x] Offline storage for favorites & last-read page memory
- [x] Realistic 3D Page Flip & Scroll view modes
- [x] Khmer Text-to-Speech (TTS) audio engine
- [x] Search & multi-category legal filters
- [x] Web & Capacitor Android mobile config
