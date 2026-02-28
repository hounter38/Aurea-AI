package com.aurea.sms.helper

import java.util.Calendar
import java.util.regex.Pattern

data class ExtractedEvent(
    val title: String,
    val description: String,
    val startTime: Calendar,
    val endTime: Calendar,
    val source: String
)

object DateExtractor {

    private val TIME_PATTERN = Pattern.compile(
        "(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm|AM|PM)",
        Pattern.CASE_INSENSITIVE
    )

    private val DATE_PATTERNS = listOf(
        Pattern.compile(
            "(\\d{1,2})/(\\d{1,2})(?:/(\\d{2,4}))?",
            Pattern.CASE_INSENSITIVE
        ),
        Pattern.compile(
            "(\\d{1,2})-(\\d{1,2})(?:-(\\d{2,4}))?",
            Pattern.CASE_INSENSITIVE
        )
    )

    private val DAY_NAMES = mapOf(
        "monday" to Calendar.MONDAY,
        "tuesday" to Calendar.TUESDAY,
        "wednesday" to Calendar.WEDNESDAY,
        "thursday" to Calendar.THURSDAY,
        "friday" to Calendar.FRIDAY,
        "saturday" to Calendar.SATURDAY,
        "sunday" to Calendar.SUNDAY,
        "mon" to Calendar.MONDAY,
        "tue" to Calendar.TUESDAY,
        "tues" to Calendar.TUESDAY,
        "wed" to Calendar.WEDNESDAY,
        "thu" to Calendar.THURSDAY,
        "thur" to Calendar.THURSDAY,
        "thurs" to Calendar.THURSDAY,
        "fri" to Calendar.FRIDAY,
        "sat" to Calendar.SATURDAY,
        "sun" to Calendar.SUNDAY
    )

    private val RELATIVE_DAYS = mapOf(
        "today" to 0,
        "tonight" to 0,
        "tomorrow" to 1,
        "tmrw" to 1,
        "tmr" to 1,
        "day after tomorrow" to 2
    )

    private val EVENT_KEYWORDS = listOf(
        "meet", "meeting", "lunch", "dinner", "breakfast", "coffee",
        "call", "appointment", "visit", "party", "event", "game",
        "practice", "class", "session", "interview", "date",
        "pickup", "pick up", "drop off", "flight", "trip",
        "doctor", "dentist", "gym", "workout", "concert", "show",
        "brunch", "hangout", "hang out", "catch up", "drinks"
    )

    fun extractEvents(text: String, source: String): List<ExtractedEvent> {
        val events = mutableListOf<ExtractedEvent>()
        val lowerText = text.lowercase()

        val hasEventKeyword = EVENT_KEYWORDS.any { lowerText.contains(it) }
        if (!hasEventKeyword) return events

        val time = extractTime(text)
        val date = extractDate(text)

        if (time != null || date != null) {
            val calendar = Calendar.getInstance()

            if (date != null) {
                calendar.set(Calendar.YEAR, date.get(Calendar.YEAR))
                calendar.set(Calendar.MONTH, date.get(Calendar.MONTH))
                calendar.set(Calendar.DAY_OF_MONTH, date.get(Calendar.DAY_OF_MONTH))
            }

            if (time != null) {
                calendar.set(Calendar.HOUR_OF_DAY, time.get(Calendar.HOUR_OF_DAY))
                calendar.set(Calendar.MINUTE, time.get(Calendar.MINUTE))
                calendar.set(Calendar.SECOND, 0)
                calendar.set(Calendar.MILLISECOND, 0)
            } else {
                calendar.set(Calendar.HOUR_OF_DAY, 9)
                calendar.set(Calendar.MINUTE, 0)
                calendar.set(Calendar.SECOND, 0)
                calendar.set(Calendar.MILLISECOND, 0)
            }

            if (calendar.timeInMillis < System.currentTimeMillis()) {
                return events
            }

            val endCalendar = calendar.clone() as Calendar
            endCalendar.add(Calendar.HOUR_OF_DAY, 1)

            val keyword = EVENT_KEYWORDS.firstOrNull { lowerText.contains(it) } ?: "Event"
            val title = "Date from chat: ${keyword.replaceFirstChar { it.uppercase() }}"

            events.add(
                ExtractedEvent(
                    title = title,
                    description = text,
                    startTime = calendar,
                    endTime = endCalendar,
                    source = source
                )
            )
        }

        return events
    }

    private fun extractTime(text: String): Calendar? {
        val matcher = TIME_PATTERN.matcher(text)
        if (matcher.find()) {
            val hour = matcher.group(1)?.toIntOrNull() ?: return null
            val minute = matcher.group(2)?.toIntOrNull() ?: 0
            val amPm = matcher.group(3)?.lowercase() ?: return null

            val cal = Calendar.getInstance()
            var hour24 = hour
            if (amPm == "pm" && hour != 12) hour24 += 12
            if (amPm == "am" && hour == 12) hour24 = 0

            cal.set(Calendar.HOUR_OF_DAY, hour24)
            cal.set(Calendar.MINUTE, minute)
            return cal
        }

        val simpleTime = Pattern.compile("at\\s+(\\d{1,2})(?::(\\d{2}))?(?:\\s|$)").matcher(text)
        if (simpleTime.find()) {
            val hour = simpleTime.group(1)?.toIntOrNull() ?: return null
            val minute = simpleTime.group(2)?.toIntOrNull() ?: 0
            if (hour in 1..12) {
                val cal = Calendar.getInstance()
                val hour24 = if (hour < 8) hour + 12 else hour
                cal.set(Calendar.HOUR_OF_DAY, hour24)
                cal.set(Calendar.MINUTE, minute)
                return cal
            }
        }

        return null
    }

    private fun extractDate(text: String): Calendar? {
        val lowerText = text.lowercase()

        for ((word, offset) in RELATIVE_DAYS) {
            if (lowerText.contains(word)) {
                val cal = Calendar.getInstance()
                cal.add(Calendar.DAY_OF_YEAR, offset)
                return cal
            }
        }

        for ((dayName, dayConst) in DAY_NAMES) {
            if (lowerText.contains(dayName)) {
                val cal = Calendar.getInstance()
                val today = cal.get(Calendar.DAY_OF_WEEK)
                var daysUntil = dayConst - today
                if (daysUntil <= 0) daysUntil += 7
                cal.add(Calendar.DAY_OF_YEAR, daysUntil)
                return cal
            }
        }

        for (pattern in DATE_PATTERNS) {
            val matcher = pattern.matcher(text)
            if (matcher.find()) {
                val month = (matcher.group(1)?.toIntOrNull() ?: continue) - 1
                val day = matcher.group(2)?.toIntOrNull() ?: continue
                var year = matcher.group(3)?.toIntOrNull()

                val cal = Calendar.getInstance()
                if (year != null) {
                    if (year < 100) year += 2000
                } else {
                    year = cal.get(Calendar.YEAR)
                }

                if (month in 0..11 && day in 1..31) {
                    cal.set(Calendar.YEAR, year)
                    cal.set(Calendar.MONTH, month)
                    cal.set(Calendar.DAY_OF_MONTH, day)
                    return cal
                }
            }
        }

        return null
    }
}
