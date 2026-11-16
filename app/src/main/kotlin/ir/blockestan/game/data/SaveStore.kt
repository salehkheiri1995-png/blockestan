package ir.blockestan.game.data

import android.content.Context
import android.util.AtomicFile
import ir.blockestan.game.core.persistence.AppSaveData
import ir.blockestan.game.core.persistence.CorruptSaveException
import ir.blockestan.game.core.persistence.SaveCodec
import ir.blockestan.game.core.persistence.UnsupportedSaveVersionException
import java.io.File
import java.io.FileOutputStream

data class LoadReport(
    val data: AppSaveData,
    val recoveredFromBackup: Boolean = false,
    val error: String? = null
)

/**
 * Versioned JSON save on internal storage. Writes go through [AtomicFile] so a crash cannot
 * leave a half-written save, and the previous good file is kept as a one-step backup.
 */
class SaveStore(private val context: Context) {
    private val primary = File(context.filesDir, "blockestan-save.json")
    private val backup = File(context.filesDir, "blockestan-save.backup.json")

    fun load(): LoadReport {
        if (!primary.exists() && !backup.exists()) return LoadReport(AppSaveData())
        val (primaryData, primaryFailure) = readAndDecode(primary)
        if (primaryData != null) return LoadReport(primaryData)

        val (backupData, _) = readAndDecode(backup)
        // A newer-version save must never be silently replaced by an older backup.
        if (primaryFailure is UnsupportedSaveVersionException) {
            return LoadReport(
                data = AppSaveData(),
                recoveredFromBackup = false,
                error = "نسخهٔ ذخیره از این برنامه جدیدتر است؛ برای جلوگیری از آسیب، بازی با ذخیرهٔ جدید شروع می‌شود."
            )
        }
        return LoadReport(
            data = backupData ?: AppSaveData(),
            recoveredFromBackup = backupData != null,
            error = primaryFailure?.message ?: "ذخیرهٔ محلی خوانده نشد."
        )
    }

    /** Returns a description of the failure, or null on success. */
    fun save(data: AppSaveData, nowMs: Long = System.currentTimeMillis()): String? {
        val text = try {
            SaveCodec.encode(data, nowMs)
        } catch (t: Throwable) {
            return "رمزگذاری ذخیره ناموفق بود: ${t.message}"
        }
        if (primary.exists()) {
            runCatching { primary.copyTo(backup, overwrite = true) }
        }
        val atomic = AtomicFile(primary)
        var stream: FileOutputStream? = null
        return try {
            stream = atomic.startWrite()
            stream.write(text.toByteArray(Charsets.UTF_8))
            stream.flush()
            atomic.finishWrite(stream)
            null
        } catch (t: Throwable) {
            try {
                if (stream != null) atomic.failWrite(stream)
            } catch (_: Throwable) {
                // Best effort only.
            }
            "نوشتن ذخیره ناموفق بود: ${t.message}"
        }
    }

    fun clear() {
        runCatching { primary.delete() }
        runCatching { backup.delete() }
    }

    /**
     * Returns (data, failure). A null failure with non-null data is a successful read.
     */
    private fun readAndDecode(file: File): Pair<AppSaveData?, Throwable?> {
        if (!file.exists()) return null to CorruptSaveException("Save file is missing")
        return try {
            val text = file.readText(Charsets.UTF_8)
            SaveCodec.decode(text) to null
        } catch (t: Throwable) {
            null to t
        }
    }
}
