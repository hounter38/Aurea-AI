package com.aurea.app.workers

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.aurea.app.helpers.AureaApiClient

/**
 * Background worker that sends a single message to the Aurea backend.
 * This runs even if the app is closed — WorkManager guarantees delivery.
 *
 * If the network is down, it retries with exponential backoff automatically.
 */
class ProcessMessageWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    companion object {
        private const val TAG = "AureaProcessWorker"
    }

    override suspend fun doWork(): Result {
        val message = inputData.getString("message") ?: return Result.failure()
        val sender = inputData.getString("sender") ?: "Unknown"
        val source = inputData.getString("source") ?: "sms_auto"

        Log.d(TAG, "Processing message from $sender (source: $source)")

        return try {
            val response = AureaApiClient.ingestMessage(message, sender)
            Log.d(TAG, "Backend response: $response")
            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send to backend: ${e.message}")
            if (runAttemptCount < 5) Result.retry() else Result.failure()
        }
    }
}
