plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
<<<<<<< HEAD
    namespace = "com.aurea.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.aurea.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"

        // ⚠️ CHANGE THIS to your computer's WiFi IP address before building!
        // Find your IP: open Command Prompt → type "ipconfig" → look for IPv4 Address
        // Example: if your IP is 192.168.1.121, set it to "http://192.168.1.121:5000"
        // For emulator only: use "http://10.0.2.2:5000"
        buildConfigField("String", "API_BASE_URL", "\"http://192.168.1.121:5000\"")
=======
    namespace = "com.aurea.sms"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.aurea.sms"
        minSdk = 29
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"
>>>>>>> origin/main
    }

    buildTypes {
        release {
<<<<<<< HEAD
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
=======
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
>>>>>>> origin/main
        }
    }

    buildFeatures {
        viewBinding = true
<<<<<<< HEAD
        buildConfig = true
=======
>>>>>>> origin/main
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
<<<<<<< HEAD
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.work:work-runtime-ktx:2.9.1")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.google.code.gson:gson:2.11.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.6")
    implementation("androidx.recyclerview:recyclerview:1.3.2")
=======
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.2.0")
    implementation("androidx.recyclerview:recyclerview:1.3.2")
    implementation("androidx.cardview:cardview:1.0.0")
    implementation("androidx.work:work-runtime-ktx:2.10.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("com.google.ai.client.generativeai:generativeai:0.9.0")
>>>>>>> origin/main
}
