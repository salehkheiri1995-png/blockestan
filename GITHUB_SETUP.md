# کاهش حجم ریپازیتوری گیت‌هاب

## چرا ریپو این‌قدر سنگین شده؟
داخل گیت این‌ها هم کامیت شده بودند، در حالی که هیچ‌کدام برای اجرای پروژه لازم نیستند:

| مسیر | حجم تقریبی | توضیح |
| --- | --- | --- |
| `node_modules/` | ~۱۶۰ مگابایت (بیش از ۵٬۳۰۰ فایل) | پکیج‌های npm؛ با `npm install` دوباره ساخته می‌شوند |
| `dist/` | ~۶ مگابایت (بیش از ۱٬۱۰۰ فایل) | خروجی build وب؛ همان چیزی است که `cap sync` داخل `android/app/src/main/assets/public` کپی می‌کند |
| `design/` | ~۸ مگابایت | فایل‌های مستر آیکون (PNG و SVG با تصویر base64) |
| `src/assets/images/` | ~۵.۶ مگابایت | تصاویر خود بازی (لازم است، اما می‌شود فشرده‌تر کرد) |

`release/` (APK) و `android/app/build` از قبل ignore بودند و پوش نمی‌شوند.

## این تغییرات قبلاً انجام شده
فایل `.gitignore` به‌روزرسانی شد و الان `node_modules/`، `dist/`، `.vite/`، لاگ‌ها و
`android/app/src/main/assets/public/` را نادیده می‌گیرد.

## حذف فایل‌های اضافی از ریپو (بدون پاک شدن از دیسک)
```bash
git rm -r --cached node_modules dist android/app/src/main/assets/public
git commit -m "chore: stop tracking generated files"
git push
```
این کار فقط از ایندکس گیت حذف می‌کند؛ فایل‌ها روی سیستم شما می‌مانند.

## کوچک کردن تاریخچه (اختیاری)
بعد از commit بالا، ریپوی گیت‌هاب هنوز حجم قبلی را در history نگه می‌دارد. برای کوچک شدن واقعی:

```bash
# نصب ابزار (یک‌بار)
pip install git-filter-repo

# حذف کامل از تاریخچه
git filter-repo --path node_modules --path dist --invert-paths --force

# پوش اجباری
git push origin --force --all
git push origin --force --tags
```

اگر با GitHub Desktop کار می‌کنید، ساده‌ترین راه: از تنظیمات ریپو در گیت‌هاب آن را پاک کنید و
نسخهٔ تمیز را دوباره push کنید (تاریخچهٔ قبلی هم از بین می‌رود).

## چه چیزی باید در ریپو بماند؟
- کد وب: `src/`، `public/`، `index.html`، `package.json`، `package-lock.json`، `vite.config.ts`
- پروژهٔ اندروید: `android/` **بدون** `build/` و `.gradle/`
- مستندات: `ANDROID_BUILD.md`، `README.md`، `GITHUB_SETUP.md`
- `.gitignore`، `capacitor.config.ts`، `scripts/` (اسکریپت‌های ساخت آیکون)
- کلید امضا و `keystore.properties` هرگز پوش نشوند (در `.gitignore` هستند)

> نکته: برای انتشار در بازار به keystore نیاز داری؛ آن را در جای امن (مثلاً پسورد منیجر یا
> فضای ابری خصوصی) نگه دار، نه در گیت‌هاب.
