import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import java.util.Properties
import java.io.FileInputStream

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
    namespace = "br.com.redesurftank.havalshisuku"
    compileSdk = 36

    defaultConfig {
        applicationId = "br.com.redesurftank.havalshisuku"
        minSdk = 28
        //noinspection ExpiredTargetSdkVersion
        targetSdk = 28
        versionCode = 99
        versionName = "99.99"
    }

    signingConfigs {
        val keystoreFile = keystoreProperties.getProperty("storeFile")?.let { 
            rootProject.file(it) 
        } ?: file("release.keystore")
        
        if (keystoreFile.exists()) {
            create("release") {
                keyAlias = keystoreProperties.getProperty("keyAlias") ?: ""
                keyPassword = keystoreProperties.getProperty("keyPassword") ?: ""
                storeFile = keystoreFile
                storePassword = keystoreProperties.getProperty("storePassword") ?: ""
            }
        }
    }

    buildTypes {
        named("release") {
            if (signingConfigs.findByName("release") != null) {
                signingConfig = signingConfigs.getByName("release")
            } else {
                // Use debug signing if no release keystore is available
                signingConfig = signingConfigs.getByName("debug")
            }
            isMinifyEnabled = true
            isShrinkResources  = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    buildFeatures {
        aidl = true
        compose = true
    }
}

kotlin {
    jvmToolchain(11)
    compilerOptions {
        jvmTarget = JvmTarget.JVM_11
    }
}

dependencies {

    implementation(libs.appcompat)
    implementation(libs.material)
    implementation(libs.shizuku)
    implementation(libs.shizuku.provider)
    implementation(libs.hiddenapibypass)
    implementation(libs.commons.net)
    implementation(libs.lifecycle.runtime.ktx)
    implementation(libs.activity.compose)
    implementation(platform(libs.compose.bom))
    implementation(libs.ui)
    implementation(libs.ui.graphics)
    implementation(libs.ui.tooling.preview)
    implementation(libs.material3)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.gson)
    implementation(libs.coil.compose)
    implementation(libs.material.icons.extended)
    annotationProcessor(libs.annotation.processor)
    compileOnly(libs.annotation)
    debugImplementation(libs.ui.tooling)
    debugImplementation(libs.ui.test.manifest)
}