package ir.blockestan.game.util

import android.content.Context
import android.media.AudioAttributes
import android.media.SoundPool
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import ir.blockestan.game.R

/** Small SoundPool wrapper. All bundled sounds are original synthesized WAVs. */
class SoundPlayer(context: Context) {
    private val pool: SoundPool = SoundPool.Builder()
        .setMaxStreams(4)
        .setAudioAttributes(
            AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_GAME)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()
        )
        .build()

    private val place = pool.load(context, R.raw.place, 1)
    private val clear = pool.load(context, R.raw.clear, 1)
    private val invalid = pool.load(context, R.raw.invalid, 1)
    private val coin = pool.load(context, R.raw.coin, 1)
    private val win = pool.load(context, R.raw.win, 1)

    fun playPlace(enabled: Boolean) = play(place, enabled)
    fun playClear(enabled: Boolean) = play(clear, enabled)
    fun playInvalid(enabled: Boolean) = play(invalid, enabled)
    fun playCoin(enabled: Boolean) = play(coin, enabled)
    fun playWin(enabled: Boolean) = play(win, enabled)

    private fun play(soundId: Int, enabled: Boolean) {
        if (!enabled || soundId == 0) return
        pool.play(soundId, 0.9f, 0.9f, 1, 0, 1f)
    }

    fun release() {
        pool.release()
    }
}

object Haptics {
    fun click(context: Context, enabled: Boolean) {
        if (!enabled) return
        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val manager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            manager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        } ?: return
        if (!vibrator.hasVibrator()) return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(24, 80))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(24)
        }
    }
}
