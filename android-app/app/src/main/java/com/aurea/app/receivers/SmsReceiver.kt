package com.aurea.app.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import androidx.work.*
import com.aurea.app.workers.ProcessMessageWorker

/**
 * Fires INSTANTLY when a new SMS arrives on the phone.
 * No user action needed — this is fully automatic.
 *
 * Flow: SMS arrives → Android OS triggers this receiver → we extract the
 * message text + sender → fire a one-shot WorkManager job to POST it
 * to the Aurea backend → backend extracts events → pushes to Google Calendar.
 */
class SmsReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "AureaSmsReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        if (messages.isNullOrEmpty()) return

        // Combine multi-part SMS into single message
        val fullBody = messages.joinToString("") { it.messageBody ?: "" }
        val sender = messages[0].originatingAddress ?: "Unknown"

        Log.d(TAG, "New SMS from $sender: ${fullBody.take(50)}...")

        // Fire background job to send to backend (survives app being killed)
        val workData = workDataOf(
            "message" to fullBody,
            "sender" to sender,
            "source" to "sms_auto"
        )

        val request = OneTimeWorkRequestBuilder<ProcessMessageWorker>()
            .setInputData(workData)
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, java.util.concurrent.TimeUnit.SECONDS)
            .build()

        WorkManager.getInstance(context).enqueue(request)
    }
}
