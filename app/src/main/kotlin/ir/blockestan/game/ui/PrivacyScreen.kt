package ir.blockestan.game.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ir.blockestan.game.game.GameViewModel

private val policy = """
حریم خصوصی بلوکستان
نسخهٔ ۱ · به‌روزرسانی: آبان ۱۴۰۵

۱. اطلاعاتی که ذخیره می‌شود
بلوکستان حساب کاربری ندارد و هیچ اطلاعاتی را به سرور خود ارسال نمی‌کند. پیشرفت بازی، سکه‌های مجازی، ستاره‌ها، تنظیمات صدا و لرزش و بازی نیمه‌تمام فقط در حافظهٔ داخلی دستگاه شما ذخیره می‌شود. با حذف برنامه یا پاک‌کردن داده‌های آن، این اطلاعات از بین می‌رود.

۲. تبلیغات
اگر نسخهٔ منتشرشده با شناسه‌های تبلیغاتی تپسل پیکربندی شده باشد، برای نمایش تبلیغ جایزه‌دار از SDK تپسل استفاده می‌شود. این SDK ممکن است شناسهٔ تبلیغاتی گوگل و داده‌های فنی دستگاه را برای انتخاب و اندازه‌گیری تبلیغ پردازش کند. تبلیغ فقط زمانی نمایش داده می‌شود که شما دکمهٔ آن را انتخاب کنید. هیچ تبلیغ بنری یا تبلیغ بازشدن خودکار در این نسخه وجود ندارد. سیاست حریم خصوصی تپسل در وب‌سایت رسمی آن قابل مطالعه است.

۳. انتخاب شخصی‌سازی
در تنظیمات می‌توانید رضایت خود به تبلیغ شخصی‌سازی‌شده را تغییر دهید. این انتخاب به SDK تبلیغات منتقل می‌شود. رد شخصی‌سازی به معنای حذف کامل تبلیغ نیست.

۴. خرید
همهٔ سکه‌ها مجازی و بدون ارزش پولی‌اند. در این نسخه خرید پول واقعی، اشتراک یا بازارچه وجود ندارد.

۵. کودکان
این بازی برای مخاطب ۱۳ سال و بالاتر طراحی شده است. اگر سن کمتری دارید، لطفاً با سرپرست خود بازی کنید.

۶. مجوزها
دسترسی به اینترنت و وضعیت شبکه فقط برای بارگذاری تبلیغ اختیاری است. دسترسی به شناسهٔ تبلیغاتی مطابق الزام SDK تبلیغات اعلام می‌شود. بازی برای ذخیرهٔ پیشرفت به مجوز خاصی نیاز ندارد.

۷. تماس
برای پرسش‌های حریم خصوصی، از بخش تماس صفحهٔ فروشگاه برنامه استفاده کنید. ایمیل اختصاصی ناشر باید پیش از انتشار در همین بخش و در فایل PRIVACY_POLICY_FA.md جایگزین شود.

۸. تغییرات
اگر این سیاست تغییر کند، نسخهٔ جدید همراه با به‌روزرسانی برنامه منتشر می‌شود و تاریخ بالای متن به‌روز می‌شود.
""".trimIndent()

@Composable
fun PrivacyScreen(vm: GameViewModel) {
    val palette = LocalGamePalette.current
    Column(Modifier.fillMaxSize()) {
        TopBar(title = "حریم خصوصی", onBack = vm::goHome)
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 18.dp, vertical = 8.dp)
        ) {
            Text(
                text = policy,
                color = palette.onSurface,
                fontSize = 12.sp,
                lineHeight = 21.sp
            )
            Text(
                text = "این متن داخل برنامه است و جایگزین سند حقوقی منتشرشده نیست.",
                color = palette.onSurfaceMuted,
                fontSize = 10.sp,
                fontWeight = FontWeight.Normal,
                modifier = Modifier.padding(vertical = 16.dp)
            )
        }
    }
}
