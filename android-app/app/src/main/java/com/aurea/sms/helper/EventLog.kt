package com.aurea.sms.helper

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class EventLogEntry(
    val title: String,
    val dateTime: String,
    val source: String,
    val addedAt: String
)

object EventLog {

    private const val PREFS_NAME = "aurea_event_log"
    private const val KEY_EVENTS = "logged_events"
    private const val KEY_PROCESSED_IDS = "processed_sms_ids"
    private const val MAX_LOG_ENTRIES = 200

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun addEntry(context: Context, entry: EventLogEntry) {
        val prefs = getPrefs(context)
        val existing = getEntries(context).toMutableList()
        existing.add(0, entry)

        if (existing.size > MAX_LOG_ENTRIES) {
            existing.subList(MAX_LOG_ENTRIES, existing.size).clear()
        }

        val jsonArray = JSONArray()
        existing.forEach { e ->
            val obj = JSONObject().apply {
                put("title", e.title)
                put("dateTime", e.dateTime)
                put("source", e.source)
                put("addedAt", e.addedAt)
            }
            jsonArray.put(obj)
        }

        prefs.edit().putString(KEY_EVENTS, jsonArray.toString()).apply()
    }

    fun getEntries(context: Context): List<EventLogEntry> {
        val prefs = getPrefs(context)
        val json = prefs.getString(KEY_EVENTS, "[]") ?: "[]"
        val entries = mutableListOf<EventLogEntry>()

        try {
            val arr = JSONArray(json)
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                entries.add(
                    EventLogEntry(
                        title = obj.getString("title"),
                        dateTime = obj.getString("dateTime"),
                        source = obj.getString("source"),
                        addedAt = obj.getString("addedAt")
                    )
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return entries
    }

    fun getTodayCount(context: Context): Int {
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        return getEntries(context).count { it.addedAt.startsWith(today) }
    }

    fun isProcessed(context: Context, smsId: Long): Boolean {
        val prefs = getPrefs(context)
        val ids = prefs.getStringSet(KEY_PROCESSED_IDS, emptySet()) ?: emptySet()
        return ids.contains(smsId.toString())
    }

    fun markProcessed(context: Context, smsId: Long) {
        val prefs = getPrefs(context)
        val ids = (prefs.getStringSet(KEY_PROCESSED_IDS, emptySet()) ?: emptySet()).toMutableSet()
        ids.add(smsId.toString())

        if (ids.size > 5000) {
            val trimmed = ids.toList().takeLast(3000).toMutableSet()
            prefs.edit().putStringSet(KEY_PROCESSED_IDS, trimmed).apply()
        } else {
            prefs.edit().putStringSet(KEY_PROCESSED_IDS, ids).apply()
        }
    }
}
