package com.aurea.sms.network

import android.content.Context
import android.util.Log
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

object AureaApiClient {

    private const val TAG = "AureaApiClient"
    private const val PREFS_NAME = "aurea_api_prefs"
    private const val KEY_BASE_URL = "api_base_url"
    private const val DEFAULT_BASE_URL = "https://c805fcb3-6360-4e9a-9d88-e00471a4eae6-00-1s2ug6qvt9d07.riker.replit.dev"
    private const val TIMEOUT_MS = 15_000

    private fun cleanUrl(raw: String): String {
        var url = raw.trim()
        url = url.trimEnd('/')
        if (url.endsWith("/api")) {
            url = url.removeSuffix("/api")
        }
        return url
    }

    fun getBaseUrl(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val raw = prefs.getString(KEY_BASE_URL, DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL
        return cleanUrl(raw)
    }

    fun setBaseUrl(context: Context, url: String) {
        val cleaned = cleanUrl(url)
        Log.d(TAG, "Base URL set to: $cleaned")
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_BASE_URL, cleaned).apply()
    }

    fun sendSms(context: Context, message: String, sender: String): Boolean {
        val baseUrl = getBaseUrl(context)
        val endpoint = "$baseUrl/api/sms/ingest"
        Log.d(TAG, "Sending SMS to: $endpoint")
        return try {
            val url = URL(endpoint)
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.setRequestProperty("Accept", "application/json")
            conn.connectTimeout = TIMEOUT_MS
            conn.readTimeout = TIMEOUT_MS
            conn.doOutput = true

            val json = JSONObject().apply {
                put("message", message)
                put("sender", sender)
            }

            Log.d(TAG, "Request body: $json")

            OutputStreamWriter(conn.outputStream).use { writer ->
                writer.write(json.toString())
                writer.flush()
            }

            val responseCode = conn.responseCode
            Log.d(TAG, "Response code: $responseCode")

            if (responseCode in 200..299) {
                val response = conn.inputStream.bufferedReader().readText()
                Log.d(TAG, "SMS forwarded successfully: $response")
                true
            } else {
                val errorBody = try { conn.errorStream?.bufferedReader()?.readText() } catch (_: Exception) { null }
                Log.w(TAG, "Server returned $responseCode: $errorBody")
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to forward SMS to $endpoint: ${e.javaClass.simpleName} - ${e.message}")
            false
        }
    }

    fun checkHealth(context: Context): Pair<Boolean, String> {
        val baseUrl = getBaseUrl(context)
        val endpoint = "$baseUrl/api/health"
        Log.d(TAG, "Health check: $endpoint")
        return try {
            val url = URL(endpoint)
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "GET"
            conn.setRequestProperty("Accept", "application/json")
            conn.connectTimeout = TIMEOUT_MS
            conn.readTimeout = TIMEOUT_MS

            val responseCode = conn.responseCode
            if (responseCode == 200) {
                val body = conn.inputStream.bufferedReader().readText()
                Log.d(TAG, "Health check OK: $body")
                Pair(true, body)
            } else {
                Log.w(TAG, "Health check failed: HTTP $responseCode")
                Pair(false, "HTTP $responseCode")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Health check error: ${e.javaClass.simpleName} - ${e.message}")
            Pair(false, "${e.javaClass.simpleName}: ${e.message}")
        }
    }
}
