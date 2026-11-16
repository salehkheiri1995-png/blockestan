# Keep Kotlin serialization metadata used by generated serializers.
-keepattributes RuntimeVisibleAnnotations,AnnotationDefault
-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}
-keep,includedescriptorclasses class ir.blockestan.game.**$$serializer { *; }
-keepclassmembers class ir.blockestan.game.** {
    *** Companion;
}
-keepclasseswithmembers class ir.blockestan.game.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Tapsell documents that its consumer rules are bundled with the AAR.
# Keep this file limited to project-specific rules.
