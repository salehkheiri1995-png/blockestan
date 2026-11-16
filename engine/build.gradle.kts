import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("org.jetbrains.kotlin.jvm")
    id("org.jetbrains.kotlin.plugin.serialization")
}

group = "ir.blockestan.game"
version = "0.1.0"

kotlin {
    jvmToolchain(17)
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

dependencies {
    api("org.jetbrains.kotlinx:kotlinx-serialization-json:1.13.0")

    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.10.2")
}

tasks.test {
    useJUnit()
    testLogging {
        events("passed", "skipped", "failed")
        exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.FULL
    }
}

/**
 * Offline level authoring tool. It replays every generated reference solution through the
 * production engine before writing the catalog. The resulting JSON is committed and is
 * verified again by LevelCatalogTest on every test run.
 */
tasks.register<JavaExec>("generateLevels") {
    group = "blockestan"
    description = "Generate and verify all 60 campaign levels into engine/src/main/resources/levels.json"
    dependsOn(tasks.named("testClasses"))
    classpath = sourceSets["test"].runtimeClasspath
    mainClass.set("ir.blockestan.game.tools.LevelGeneratorKt")
    workingDir = projectDir
    args("src/main/resources/levels.json")
}
