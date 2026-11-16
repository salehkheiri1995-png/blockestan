package ir.blockestan.game.core.persistence

import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonPrimitive

object SaveFormat {
    const val CURRENT = 1
}

class UnsupportedSaveVersionException(message: String) : Exception(message)
class CorruptSaveException(message: String, cause: Throwable? = null) : Exception(message, cause)

@Serializable
data class SaveEnvelope(
    val formatVersion: Int,
    val savedAtEpochMs: Long,
    val data: JsonElement
)

/**
 * Versioned envelope around the whole local save. Backups are handled by AtomicFile in the
 * Android layer; this codec is unit-tested on the JVM and is independent of Android.
 */
object SaveCodec {
    private val json = Json {
        encodeDefaults = true
        ignoreUnknownKeys = true
        isLenient = false
    }

    fun encode(data: AppSaveData, savedAtEpochMs: Long): String {
        val element = json.encodeToJsonElement(AppSaveData.serializer(), data.sanitized())
        return json.encodeToString(
            SaveEnvelope.serializer(),
            SaveEnvelope(SaveFormat.CURRENT, savedAtEpochMs, element)
        )
    }

    fun decode(raw: String): AppSaveData {
        val envelope = try {
            json.decodeFromString(SaveEnvelope.serializer(), raw)
        } catch (t: Throwable) {
            throw CorruptSaveException("Save envelope is not valid JSON", t)
        }
        if (envelope.formatVersion > SaveFormat.CURRENT) {
            throw UnsupportedSaveVersionException(
                "Save format ${envelope.formatVersion} is newer than ${SaveFormat.CURRENT}"
            )
        }
        val migrated = migrations.migrate(envelope.data, envelope.formatVersion)
            ?: throw UnsupportedSaveVersionException(
                "No migration from save format ${envelope.formatVersion}"
            )
        val data = try {
            json.decodeFromJsonElement(AppSaveData.serializer(), migrated)
        } catch (t: Throwable) {
            throw CorruptSaveException("Save payload is not valid", t)
        }
        if (data.formatVersion != SaveFormat.CURRENT) {
            throw CorruptSaveException(
                "Payload version ${data.formatVersion} does not match ${SaveFormat.CURRENT}"
            )
        }
        return data.sanitized()
    }

    fun peekVersion(raw: String): Int? = try {
        val obj = json.parseToJsonElement(raw) as? JsonObject ?: return null
        obj["formatVersion"]?.jsonPrimitive?.content?.toIntOrNull()
    } catch (_: Throwable) {
        null
    }

    fun dataVersion(element: JsonElement): Int? = try {
        val obj = element as? JsonObject ?: return null
        obj["formatVersion"]?.jsonPrimitive?.content?.toIntOrNull()
    } catch (_: Throwable) {
        null
    }
}

private object migrations {
    fun migrate(data: JsonElement, fromVersion: Int): JsonElement? {
        var current = data
        var version = fromVersion
        while (version < SaveFormat.CURRENT) {
            current = when (version) {
                // No historical releases yet. Future migration steps go here.
                else -> return null
            }
            version++
        }
        return current
    }
}
