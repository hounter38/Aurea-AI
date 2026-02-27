package com.aurea.app.workers

import android.content.Context
import android.database.Cursor
import android.net.Uri
import android.provider.CallLog
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.aurea.app.helpers.AureaApiClient

/**
 * Periodic background scanner — runs every 15 minutes via WorkManager.
 *
 * Reads the latest SMS messages and call log entries from the phone,
 * checks which ones haven't been sent yet, and POSTs them to the backend.
 *
 * This catches anything the real-time BroadcastReceiver might have missed.
 */
class ScanWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    companion object {
        private const val TAG = "AureaScanWorker"
        private const val MAX_SMS = 100
        private const val MAX_CALLS = 50
        private const val PREFS_NAME = "aurea_scan"
        private const val KEY_LAST_SMS_ID = "last_sms_id"
        private const val KEY_LAST_CALL_ID = "last_call_id"
    }

    override suspend fun doWork(): Result {
        Log.d(TAG, "Starting periodic scan...")

        val prefs = applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val lastSmsId = prefs.getLong(KEY_LAST_SMS_ID, 0)
        val lastCallId = prefs.getLong(KEY_LAST_CALL_ID, 0)

        var newLastSmsId = lastSmsId
        var newLastCallId = lastCallId
        var processed = 0

        // Scan SMS inbox
        try {
            val smsCursor: Cursor? = applicationContext.contentResolver.query(
                Uri.parse("content://sms/inbox"),
                arrayOf("_id", "address", "body", "date"),
                "_id > ?",
                arrayOf(lastSmsId.toString()),
                "_id DESC LIMIT $MAX_SMS"
            )

            smsCursor?.use { cursor ->
                while (cursor.moveToNext()) {
                    val id = cursor.getLong(0)
                    val sender = cursor.getString(1) ?: "Unknown"
                    val body = cursor.getString(2) ?: continue
                    if (body.isBlank()) continue

                    try {
                        AureaApiClient.ingestMessage(body, sender)
                        processed++
                        if (id > newLastSmsId) newLastSmsId = id
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to ingest SMS $id: ${e.message}")
                    }
                }
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "SMS permission not granted: ${e.message}")
        }

        // Scan call log
        try {
            val callCursor: Cursor? = applicationContext.contentResolver.query(
                CallLog.Calls.CONTENT_URI,
                arrayOf(CallLog.Calls._ID, CallLog.Calls.NUMBER, CallLog.Calls.CACHED_NAME, CallLog.Calls.DURATION, CallLog.Calls.TYPE),
                "${CallLog.Calls._ID} > ?",
                arrayOf(lastCallId.toString()),
                "${CallLog.Calls._ID} DESC LIMIT $MAX_CALLS"
            )

            callCursor?.use { cursor ->
                while (cursor.moveToNext()) {
                    val id = cursor.getLong(0)
                    val number = cursor.getString(1) ?: "Unknown"
                    val name = cursor.getString(2) ?: number
                    val duration = cursor.getInt(3)
                    val type = cursor.getInt(4)

                    // Only process incoming calls longer than 30 seconds
                    if (type == CallLog.Calls.INCOMING_TYPE && duration > 30) {
                        val callDescription = "Incoming call from $name ($number), duration: ${duration}s"
                        try {
                            AureaApiClient.ingestMessage(callDescription, name)
                            processed++
                        } catch (e: Exception) {
                            Log.e(TAG, "Failed to ingest call $id: ${e.message}")
                        }
                    }
                    if (id > newLastCallId) newLastCallId = id
                }
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "Call log permission not granted: ${e.message}")
        }

        // Save progress
        prefs.edit()
            .putLong(KEY_LAST_SMS_ID, newLastSmsId)
            .putLong(KEY_LAST_CALL_ID, newLastCallId)
            .apply()

        Log.d(TAG, "Scan complete. Processed $processed new items.")
        return Result.success()
    }
}
