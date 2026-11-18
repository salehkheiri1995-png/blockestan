# ساخت APK اندروید بلوکستان

نسخهٔ وب بازی با [Capacitor](https://capacitorjs.com/) داخل یک اپ اندرویدی بسته‌بندی شده است.

- نام بسته: `ir.blockestan.game`
- نام نمایشی: بلوکستان
- `minSdk 24` (اندروید ۷)، `targetSdk 35`
- پروژهٔ بومی: `android/`
- تنظیمات: `capacitor.config.ts`

## پیش‌نیازها

- Node.js 20+
- JDK 21 (این پروژه با `C:\Android\jdk21\jdk-21.0.13+9` ساخته شد)
- Android SDK با Platform 35 و Build Tools 36 (مسیر در `android/local.properties`)

## ساخت نسخهٔ آزمایشی (debug)

```powershell
npm install
npm run build
npx cap sync android

$env:JAVA_HOME = "C:\Android\jdk21\jdk-21.0.13+9"
cd android
.\gradlew.bat assembleDebug
```

خروجی: `android/app/build/outputs/apk/debug/app-debug.apk`

## ساخت نسخهٔ انتشار (release امضاشده)

```powershell
npm run build
npx cap sync android

$env:JAVA_HOME = "C:\Android\jdk21\jdk-21.0.13+9"
cd android
.\gradlew.bat assembleRelease
```

خروجی: `android/app/build/outputs/apk/release/app-release.apk`

امضا از `android/keystore.properties` خوانده می‌شود (این فایل و فایل `.jks` در git نیستند).

## کلید امضا

- Keystore: `C:\Users\Administrator\blockestan-keys\blockestan-release.jks`
- Alias: `blockestan`
- اثر انگشت SHA-256 گواهی:
  `19A8EDBD8A216B2BFA2A6382494998130E551F7AF0070DF09844CD128A66D035`

> این کلید و رمزش را جای امن و جداگانه پشتیبان‌گیری کنید. برای همهٔ آپدیت‌های بعدی در بازار باید با همین کلید امضا شود.

## افزایش نسخه

در `android/app/build.gradle`:

```gradle
versionCode 2
versionName "1.0.1"
```

## به‌روزرسانی محتوای بازی

هر بار بعد از تغییر کد وب:

```powershell
npm run build
npx cap sync android
```

سپس دوباره Gradle build بگیرید.

## تولید دوبارهٔ آیکون و اسپلش

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\generate-android-assets.ps1
```
