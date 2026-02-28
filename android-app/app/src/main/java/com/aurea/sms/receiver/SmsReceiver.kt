package com.aurea.sms.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import com.aurea.sms.helper.CalendarHelper
import com.aurea.sms.helper.DateExtractor
import com.aurea.sms.helper.EventLog
import com.aurea.sms.helper.EventLogEntry
import com.aurea.sms.network.AureaApiClient
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.concurrent.thread

class SmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        try {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            val fullBody = messages.joinToString("") { it.messageBody ?: "" }
            val sender = messages.firstOrNull()?.originatingAddress ?: "Unknown"

            if (fullBody.length < 10) return

            thread {
                AureaApiClient.sendSms(context, fullBody, sender)
            }

            val events = DateExtractor.extractEvents(fullBody, "SMS from $sender")

            for (event in events) {
                val eventId = CalendarHelper.addEvent(
                    context,
                    event.title,
                    event.description,
                    event.startTime,
                    event.endTime
                )

                if (eventId != null) {
                    val dateFormat = SimpleDateFormat(
                        "MMM dd, yyyy h:mm a",
                        Locale.getDefault()
                    )

                    EventLog.addEntry(
                        context,
                        EventLogEntry(
                            title = event.title,
                            dateTime = dateFormat.format(event.startTime.time),
                            source = event.source,
                            addedAt = SimpleDateFormat(
                                "yyyy-MM-dd HH:mm",
                                Locale.getDefault()
                            ).format(Date())
                        )
                    )
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
