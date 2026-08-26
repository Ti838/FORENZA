# FORENZA — Platform Support & System Requirements

This document specifies the supported operating systems, architectures, runtime environments, and hardware permissions for FORENZA across all client targets.

---

## 1. Web Application

* **Runtime Target:** Modern ECMAScript 2022+ compliant web browsers.
* **Supported Browsers:**
  * Google Chrome / Chromium (v110+)
  * Mozilla Firefox (v115+ ESR)
  * Apple Safari (v16.4+)
  * Microsoft Edge (v110+)
* **Hardware API Requirements:**
  * Geolocation API (`navigator.geolocation`)
  * WebRTC Camera API (`navigator.mediaDevices.getUserMedia`)
  * Web Crypto API (`crypto.subtle`)

---

## 2. Desktop Application (Tauri 2.x)

* **Windows Target:**
  * **OS:** Windows 10 (Build 19041+) / Windows 11 (64-bit x86_64 / ARM64).
  * **Runtime Engine:** Microsoft Edge WebView2 Evergreen Runtime.
  * **Binary Artifact:** Single executable installer (`.msi` / `.exe`).
* **macOS Target:**
  * **OS:** macOS 11.0 (Big Sur) through macOS 15.x (Sequoia).
  * **Architectures:** Universal Binary (Apple Silicon ARM64 & Intel x86_64).
  * **Binary Artifact:** Standalone App Bundle (`.app`) inside signed `.dmg`.
* **Linux Target:**
  * **Distributions:** Ubuntu 22.04+ LTS, Debian 12+, Fedora 38+, Arch Linux.
  * **Binary Artifacts:** Self-contained `.AppImage` and native Debian package (`.deb`).

---

## 3. Mobile Application (Flutter Native)

* **Android Target:**
  * **Minimum SDK:** Android 7.0 (API Level 24, Nougat).
  * **Target SDK:** Android 14 / 15 (API Level 34 / 35).
  * **Binary Artifacts:** Signed Release APK (`app-release.apk`) & Google Play Android App Bundle (`app-release.aab`).
  * **Hardware Sensor Requirements:**
    * Native Camera & Autofocus (`android.hardware.camera`)
    * GPS / GNSS Location Provider (`ACCESS_FINE_LOCATION`)
    * Biometric Fingerprint / Face Authentication (`USE_BIOMETRIC`)
* **iOS Target (Supported in Flutter Codebase):**
  * **Minimum Target:** iOS 14.0+ (ARM64).
  * **Permissions:** Camera Usage (`NSCameraUsageDescription`), Location When In Use (`NSLocationWhenInUseUsageDescription`).

---

## 4. Central Backend & Cloud Infrastructure

* **Server Runtime:** Node.js 20.x+ LTS / Next.js 16 Serverless Functions.
* **Database Target:** PostgreSQL 15.0+ (Hosted on Supabase Cloud / Self-Hosted Docker).
* **Storage Target:** S3-compatible private object storage (Supabase Storage).
* **AI Provider:** Google Gemini API (`gemini-2.0-flash`).
