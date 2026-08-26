# FORENZA — Multi-Platform Setup & Build Guide

---

## 1. Prerequisites

* **Node.js:** v20.x or v22.x LTS
* **Package Manager:** `npm` v10+
* **Rust (for Desktop build):** `rustc` v1.75+ & `cargo`
* **Flutter SDK (for Android build):** `flutter` v3.19+ & Android Studio SDK 34+

---

## 2. Web Application Setup & Run

```bash
# 1. Navigate to web directory and install dependencies
cd web
npm install

# 2. Configure environment variables (.env.local)
cp ../.env.example .env.local
# Populate NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, GEMINI_API_KEY, etc.

# 3. Verify TypeScript type safety
npm run typecheck

# 4. Run automated test suite (49/49 tests)
npm test

# 5. Launch development server
npm run dev
# Open http://localhost:3000
```

---

## 3. Desktop Application Build (Tauri 2.x)

```bash
# 1. Navigate to desktop directory
cd desktop

# 2. Run Desktop App in development mode (with hot reload)
npx tauri dev

# 3. Build release-ready desktop installer
npx tauri build
# Outputs:
# Windows: target/release/bundle/msi/FORENZA_1.0.0_x64_en-US.msi
# macOS:   target/release/bundle/dmg/FORENZA_1.0.0_universal.dmg
# Linux:   target/release/bundle/appimage/FORENZA_1.0.0_amd64.AppImage
```

---

## 4. Android Mobile Application Build (Flutter)

```bash
# 1. Navigate to mobile directory
cd mobile

# 2. Get Dart dependencies
flutter pub get

# 3. Run on connected Android device or emulator
flutter run

# 4. Build standalone Release APK
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk

# 5. Build Google Play Store Bundle (AAB)
flutter build appbundle --release
# Output: build/app/outputs/bundle/release/app-release.aab
```

---

## 5. Supabase Database Migrations

Apply SQL migrations 001 through 017 in sequence using the Supabase SQL Editor:
1. `supabase/migrations/20240001000001_create_enums.sql` through `...017_compliance_legal_layer.sql`
2. Or execute `supabase/master_init.sql` in a single run.
