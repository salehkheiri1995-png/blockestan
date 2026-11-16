package ir.blockestan.game.core.generation

import ir.blockestan.game.core.engine.GameBalanceConfig
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

object LevelCatalog {
    const val RESOURCE_PATH = "/levels.json"
    const val FORMAT_VERSION = 1
    const val GENERATOR_VERSION = 1

    private val json = Json {
        ignoreUnknownKeys = false
        isLenient = false
    }

    val levels: List<LevelDefinition> by lazy { loadFromClasspath() }

    fun byId(id: Int): LevelDefinition? = levels.firstOrNull { it.id == id }

    fun loadFromClasspath(): List<LevelDefinition> {
        val stream = LevelCatalog::class.java.getResourceAsStream(RESOURCE_PATH)
            ?: error("Level catalog resource $RESOURCE_PATH is missing")
        val text = stream.bufferedReader(Charsets.UTF_8).use { it.readText() }
        return parse(text)
    }

    fun parse(text: String): List<LevelDefinition> {
        val file = json.decodeFromString<LevelCatalogFile>(text)
        require(file.formatVersion == FORMAT_VERSION) {
            "Unsupported level catalog format ${file.formatVersion}"
        }
        require(file.levels.size == GameBalanceConfig.TOTAL_LEVELS) {
            "Expected ${GameBalanceConfig.TOTAL_LEVELS} levels, found ${file.levels.size}"
        }
        require(file.levels.map { it.id }.distinct().size == file.levels.size) {
            "Duplicate level ids"
        }
        val sorted = file.levels.sortedBy { it.id }
        require(sorted.map { it.id } == (1..GameBalanceConfig.TOTAL_LEVELS).toList()) {
            "Level ids must be exactly 1..${GameBalanceConfig.TOTAL_LEVELS}"
        }
        sorted.forEach { it.validateStatic(GameBalanceConfig.TOTAL_LEVELS) }
        return sorted
    }

    fun encode(file: LevelCatalogFile): String {
        val pretty = Json {
            prettyPrint = true
            encodeDefaults = true
        }
        return pretty.encodeToString(LevelCatalogFile.serializer(), file)
    }
}
