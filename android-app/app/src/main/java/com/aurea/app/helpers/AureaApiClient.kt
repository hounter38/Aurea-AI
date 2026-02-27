package com.aurea.app.helpers

import com.aurea.app.BuildConfig
import com.google.gson.Gson
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

/**
 * HTTP client that sends messages to the Aurea backend server.
 *
 * The backend URL is set in build.gradle.kts via buildConfigField.
 * For local dev: http://10.0.2.2:5000 (Android emulator → host machine)
 * For production: https://your-server.com
 */
object AureaApiClient {

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()
    private val JSON = "application/json; charset=utf-8".toMediaType()

    data class IngestRequest(val message: String, val sender: String)
    data class IngestResponse(val processed: Boolean, val events_found: Int)

    /**
     * POST a message to /api/sms/ingest
     * Returns the number of calendar events extracted.
     */
    fun ingestMessage(message: String, sender: String): IngestResponse {
        val body = gson.toJson(IngestRequest(message, sender))
            .toRequestBody(JSON)

        val request = Request.Builder()
            .url("${BuildConfig.API_BASE_URL}/api/sms/ingest")
            .post(body)
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw RuntimeException("API error: ${response.code} ${response.message}")
            }
            val responseBody = response.body?.string() ?: "{}"
            return gson.fromJson(responseBody, IngestResponse::class.java)
        }
    }

    /**
     * GET /api/health to check backend connectivity.
     */
    fun checkHealth(): Boolean {
        return try {
            val request = Request.Builder()
                .url("${BuildConfig.API_BASE_URL}/api/health")
                .get()
                .build()

            client.newCall(request).execute().use { it.isSuccessful }
        } catch (e: Exception) {
            false
        }
    }
}
