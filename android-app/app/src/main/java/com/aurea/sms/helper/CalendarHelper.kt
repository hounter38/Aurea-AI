package com.aurea.sms.helper

import android.content.ContentValues
import android.content.Context
import android.provider.CalendarContract
import java.util.Calendar
import java.util.TimeZone

object CalendarHelper {

    fun addEvent(
        context: Context,
        title: String,
        description: String,
        startTime: Calendar,
        endTime: Calendar
    ): Long? {
        return try {
            val calendarId = getPrimaryCalendarId(context) ?: return null

            val values = ContentValues().apply {
                put(CalendarContract.Events.CALENDAR_ID, calendarId)
                put(CalendarContract.Events.TITLE, title)
                put(CalendarContract.Events.DESCRIPTION, description)
                put(CalendarContract.Events.DTSTART, startTime.timeInMillis)
                put(CalendarContract.Events.DTEND, endTime.timeInMillis)
                put(CalendarContract.Events.EVENT_TIMEZONE, TimeZone.getDefault().id)
                put(CalendarContract.Events.HAS_ALARM, 1)
            }

            val uri = context.contentResolver.insert(
                CalendarContract.Events.CONTENT_URI, values
            ) ?: return null

            val eventId = uri.lastPathSegment?.toLongOrNull() ?: return null

            val reminderValues = ContentValues().apply {
                put(CalendarContract.Reminders.EVENT_ID, eventId)
                put(CalendarContract.Reminders.MINUTES, 30)
                put(CalendarContract.Reminders.METHOD, CalendarContract.Reminders.METHOD_ALERT)
            }
            context.contentResolver.insert(
                CalendarContract.Reminders.CONTENT_URI, reminderValues
            )

            eventId
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private fun getPrimaryCalendarId(context: Context): Long? {
        val projection = arrayOf(
            CalendarContract.Calendars._ID,
            CalendarContract.Calendars.IS_PRIMARY
        )

        context.contentResolver.query(
            CalendarContract.Calendars.CONTENT_URI,
            projection,
            "${CalendarContract.Calendars.VISIBLE} = 1 AND ${CalendarContract.Calendars.ACCOUNT_TYPE} = ?",
            arrayOf("com.google"),
            null
        )?.use { cursor ->
            while (cursor.moveToNext()) {
                val id = cursor.getLong(0)
                val isPrimary = cursor.getInt(1)
                if (isPrimary == 1) return id
            }
            if (cursor.moveToFirst()) {
                return cursor.getLong(0)
            }
        }

        context.contentResolver.query(
            CalendarContract.Calendars.CONTENT_URI,
            arrayOf(CalendarContract.Calendars._ID),
            "${CalendarContract.Calendars.VISIBLE} = 1",
            null,
            null
        )?.use { cursor ->
            if (cursor.moveToFirst()) {
                return cursor.getLong(0)
            }
        }

        return null
    }
}
