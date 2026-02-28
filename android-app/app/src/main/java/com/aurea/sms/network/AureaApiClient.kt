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

    fun getBaseUrl(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_BASE_URL, DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL
    }

    fun setBaseUrl(context: Context, url: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_BASE_URL, url.trimEnd('/')).apply()
    }

    fun sendSms(context: Context, message: String, sender: String): Boolean {
        return try {
            val baseUrl = getBaseUrl(context)
            val url = URL("$baseUrl/api/sms/ingest")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.connectTimeout = TIMEOUT_MS
            conn.readTimeout = TIMEOUT_MS
            conn.doOutput = true

            val json = JSONObject().apply {
                put("message", message)
                put("sender", sender)
            }

            OutputStreamWriter(conn.outputStream).use { writer ->
                writer.write(json.toString())
                writer.flush()
            }

            val responseCode = conn.responseCode
            if (responseCode in 200..299) {
                val response = conn.inputStream.bufferedReader().readText()
                Log.d(TAG, "SMS forwarded successfully: $response")
                true
            } else {
                Log.w(TAG, "Server returned $responseCode")
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to forward SMS: ${e.message}")
            false
        }
    }

    fun checkHealth(context: Context): Boolean {
        return try {
            val baseUrl = getBaseUrl(context)
            val url = URL("$baseUrl/api/health")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "GET"
            conn.connectTimeout = TIMEOUT_MS
            conn.readTimeout = TIMEOUT_MS

            val responseCode = conn.responseCode
            responseCode == 200
        } catch (e: Exception) {
            Log.e(TAG, "Health check failed: ${e.message}")
            false
        }
    }
}
