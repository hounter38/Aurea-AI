package com.aurea.sms.helper

import android.content.Context
import android.net.Uri
import android.provider.CallLog
import android.provider.Telephony

data class MessageInfo(
    val id: Long,
    val body: String,
    val sender: String,
    val timestamp: Long,
    val type: String
)

data class CallInfo(
    val id: Long,
    val number: String,
    val name: String?,
    val duration: Long,
    val timestamp: Long,
    val type: Int
)

object SmsReader {

    fun readRecentMessages(context: Context, limit: Int = 100): List<MessageInfo> {
        val messages = mutableListOf<MessageInfo>()

        try {
            val inboxMessages = readFromUri(
                context,
                Telephony.Sms.Inbox.CONTENT_URI,
                "inbox",
                limit / 2
            )
            messages.addAll(inboxMessages)

            val sentMessages = readFromUri(
                context,
                Telephony.Sms.Sent.CONTENT_URI,
                "sent",
                limit / 2
            )
            messages.addAll(sentMessages)
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return messages.sortedByDescending { it.timestamp }.take(limit)
    }

    private fun readFromUri(
        context: Context,
        uri: Uri,
        type: String,
        limit: Int
    ): List<MessageInfo> {
        val messages = mutableListOf<MessageInfo>()

        val projection = arrayOf(
            Telephony.Sms._ID,
            Telephony.Sms.BODY,
            Telephony.Sms.ADDRESS,
            Telephony.Sms.DATE
        )

        context.contentResolver.query(
            uri,
            projection,
            null,
            null,
            "${Telephony.Sms.DATE} DESC LIMIT $limit"
        )?.use { cursor ->
            val idIdx = cursor.getColumnIndexOrThrow(Telephony.Sms._ID)
            val bodyIdx = cursor.getColumnIndexOrThrow(Telephony.Sms.BODY)
            val addressIdx = cursor.getColumnIndexOrThrow(Telephony.Sms.ADDRESS)
            val dateIdx = cursor.getColumnIndexOrThrow(Telephony.Sms.DATE)

            while (cursor.moveToNext()) {
                val body = cursor.getString(bodyIdx) ?: continue
                if (body.length < 10) continue

                messages.add(
                    MessageInfo(
                        id = cursor.getLong(idIdx),
                        body = body,
                        sender = cursor.getString(addressIdx) ?: "Unknown",
                        timestamp = cursor.getLong(dateIdx),
                        type = type
                    )
                )
            }
        }

        return messages
    }

    fun readRecentCalls(context: Context, limit: Int = 50): List<CallInfo> {
        val calls = mutableListOf<CallInfo>()

        try {
            val projection = arrayOf(
                CallLog.Calls._ID,
                CallLog.Calls.NUMBER,
                CallLog.Calls.CACHED_NAME,
                CallLog.Calls.DURATION,
                CallLog.Calls.DATE,
                CallLog.Calls.TYPE
            )

            context.contentResolver.query(
                CallLog.Calls.CONTENT_URI,
                projection,
                null,
                null,
                "${CallLog.Calls.DATE} DESC LIMIT $limit"
            )?.use { cursor ->
                val idIdx = cursor.getColumnIndexOrThrow(CallLog.Calls._ID)
                val numberIdx = cursor.getColumnIndexOrThrow(CallLog.Calls.NUMBER)
                val nameIdx = cursor.getColumnIndexOrThrow(CallLog.Calls.CACHED_NAME)
                val durationIdx = cursor.getColumnIndexOrThrow(CallLog.Calls.DURATION)
                val dateIdx = cursor.getColumnIndexOrThrow(CallLog.Calls.DATE)
                val typeIdx = cursor.getColumnIndexOrThrow(CallLog.Calls.TYPE)

                while (cursor.moveToNext()) {
                    calls.add(
                        CallInfo(
                            id = cursor.getLong(idIdx),
                            number = cursor.getString(numberIdx) ?: "Unknown",
                            name = cursor.getString(nameIdx),
                            duration = cursor.getLong(durationIdx),
                            timestamp = cursor.getLong(dateIdx),
                            type = cursor.getInt(typeIdx)
                        )
                    )
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return calls
    }
}
