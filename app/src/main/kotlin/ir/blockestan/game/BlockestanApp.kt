package ir.blockestan.game

import android.app.Application
import android.content.Context
import ir.blockestan.game.ads.AdsController
import ir.blockestan.game.data.GameRepository
import ir.blockestan.game.data.SaveStore
import ir.blockestan.game.util.SoundPlayer

class AppContainer(context: Context) {
    val soundPlayer = SoundPlayer(context)
    private val store = SaveStore(context)
    val repository = GameRepository(store, store.load())
    val ads = AdsController()
}

class BlockestanApp : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
