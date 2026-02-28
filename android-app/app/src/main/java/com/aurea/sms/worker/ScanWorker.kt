package com.aurea.sms.worker

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.aurea.sms.helper.CalendarHelper
import com.aurea.sms.helper.DateExtractor
import com.aurea.sms.helper.EventLog
import com.aurea.sms.helper.EventLogEntry
import com.aurea.sms.helper.SmsReader
import com.aurea.sms.network.AureaApiClient
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class ScanWorker(
    context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        return try {
            scanMessages()
            scanCalls()
            Result.success()
        } catch (e: Exception) {
            e.printStackTrace()
            Result.retry()
        }
    }

    private fun scanMessages() {
        val messages = SmsReader.readRecentMessages(applicationContext, 100)
        val dateFormat = SimpleDateFormat("MMM dd, yyyy h:mm a", Locale.getDefault())
        val nowFormat = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())

        for (msg in messages) {
            if (EventLog.isProcessed(applicationContext, msg.id)) continue

            AureaApiClient.sendSms(applicationContext, msg.body, msg.sender)

            val events = DateExtractor.extractEvents(msg.body, "SMS from ${msg.sender}")

            for (event in events) {
                val eventId = CalendarHelper.addEvent(
                    applicationContext,
                    event.title,
                    event.description,
                    event.startTime,
                    event.endTime
                )

                if (eventId != null) {
                    EventLog.addEntry(
                        applicationContext,
                        EventLogEntry(
                            title = event.title,
                            dateTime = dateFormat.format(event.startTime.time),
                            source = event.source,
                            addedAt = nowFormat.format(Date())
                        )
                    )
                }
            }

            EventLog.markProcessed(applicationContext, msg.id)
        }
    }

    private fun scanCalls() {
        val calls = SmsReader.readRecentCalls(applicationContext, 50)

        // Call logs don't typically contain scheduling text,
        // but we process any call notes or voicemail transcriptions
        // that the system may have attached. For now this is a
        // placeholder for future voicemail-to-text integration.
        for (call in calls) {
            val name = call.name ?: call.number
            EventLog.markProcessed(applicationContext, call.id)
        }
    }
}
