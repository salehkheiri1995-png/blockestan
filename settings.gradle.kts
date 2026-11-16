pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        // Official Tapsell repository, documented at developer.tapsell.ir (1.3 docs).
        // The 1.3.0 artifacts are also available on Maven Central; keeping this first
        // matches Tapsell's documented setup.
        maven("https://maven.tapsell.ir")
    }
}

rootProject.name = "Blockestan"
include(":app")
include(":engine")
