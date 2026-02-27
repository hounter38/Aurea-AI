package com.aurea.app.helpers

import android.content.ContentValues
import android.content.Context
import android.provider.CalendarContract
import java.util.*

/**
 * Creates calendar events directly on the Android device.
 * This is the LOCAL fallback — events are also created on the server
 * via Google Calendar API, but this ensures they show up immediately
 * even without internet.
 */
object CalendarHelper {

    fun createEvent(
        context: Context,
        title: String,
        startTimeMillis: Long,
        durationMinutes: Int = 60,
        description: String? = null,
        location: String? = null
    ): Long? {
        return try {
            val calendarId = getPrimaryCalendarId(context) ?: return null

            val values = ContentValues().apply {
                put(CalendarContract.Events.CALENDAR_ID, calendarId)
                put(CalendarContract.Events.TITLE, title)
                put(CalendarContract.Events.DTSTART, startTimeMillis)
                put(CalendarContract.Events.DTEND, startTimeMillis + durationMinutes * 60_000L)
                put(CalendarContract.Events.EVENT_TIMEZONE, TimeZone.getDefault().id)
                description?.let { put(CalendarContract.Events.DESCRIPTION, it) }
                location?.let { put(CalendarContract.Events.EVENT_LOCATION, it) }
            }

            val uri = context.contentResolver.insert(CalendarContract.Events.CONTENT_URI, values)
            val eventId = uri?.lastPathSegment?.toLongOrNull()

            // Add 30-minute reminder
            eventId?.let {
                val reminderValues = ContentValues().apply {
                    put(CalendarContract.Reminders.EVENT_ID, it)
                    put(CalendarContract.Reminders.MINUTES, 30)
                    put(CalendarContract.Reminders.METHOD, CalendarContract.Reminders.METHOD_ALERT)
                }
                context.contentResolver.insert(CalendarContract.Reminders.CONTENT_URI, reminderValues)
            }

            eventId
        } catch (e: SecurityException) {
            null
        }
    }

    private fun getPrimaryCalendarId(context: Context): Long? {
        val cursor = context.contentResolver.query(
            CalendarContract.Calendars.CONTENT_URI,
            arrayOf(CalendarContract.Calendars._ID),
            "${CalendarContract.Calendars.IS_PRIMARY} = 1",
            null,
            null
        )

        return cursor?.use {
            if (it.moveToFirst()) it.getLong(0) else null
        }
    }
}
