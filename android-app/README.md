<<<<<<< HEAD
# Aurea — Native Android Companion App

This is the native Android app that makes Aurea fully automatic. It reads incoming SMS and call logs in real-time and sends them to the Aurea backend for AI processing and Google Calendar event creation.

## How It Works (Zero User Interaction)

1. **SMS arrives** on your phone → `SmsReceiver` fires instantly
2. Message text + sender are packaged into a background job (`ProcessMessageWorker`)
3. Job POSTs to `POST /api/sms/ingest` on your Aurea backend
4. Backend AI extracts calendar events → pushes to Google Calendar
5. Events with ≥90% confidence are auto-confirmed

Additionally, `ScanWorker` runs every 15 minutes to catch any messages the receiver might have missed.

## Building the APK

### Prerequisites
- [Android Studio](https://developer.android.com/studio) (free)
- Android SDK 36

### Steps
1. Open Android Studio
2. File → Open → select the `android-app/` folder
3. Wait for Gradle sync to complete
4. Edit `app/build.gradle.kts` → change `API_BASE_URL` to your server URL
5. Build → Build Bundle(s) / APK(s) → Build APK
6. Transfer the APK to your Samsung phone and install

### Permissions Requested
| Permission | Why |
|-----------|-----|
| READ_SMS, RECEIVE_SMS | Read incoming text messages automatically |
| READ_CALL_LOG | Scan call history for important calls |
| READ_CONTACTS | Identify who sent messages by name |
| READ/WRITE_CALENDAR | Create events directly on device |
| INTERNET | Send messages to Aurea backend |
| POST_NOTIFICATIONS | Show status notifications |
| RECEIVE_BOOT_COMPLETED | Restart monitoring after phone reboot |

## For iOS (Apple)

iOS does not allow third-party apps to read SMS (Apple blocks it for privacy). The options for iPhone are:

1. **PWA** — Install Aurea from Safari → "Add to Home Screen". Works as a standalone app.
2. **Share extension** — Long-press a text → Share → Aurea. Semi-automatic.
3. **Email forwarding** — Auto-forward texts to an email, Aurea monitors that inbox.

The PWA is already configured with `manifest.json`, service worker, and `apple-touch-icon`.
=======
# Aurea SMS — Native Android Companion App

Native Android app that reads your text messages and call logs, detects scheduling
intent using local date/time extraction, and automatically creates calendar events.

## How to Build

1. Download and install Android Studio from https://developer.android.com/studio
2. Open Android Studio and select "Open an existing project"
3. Navigate to this `android-app` folder and open it
4. Wait for Gradle sync to complete (may take a few minutes on first run)
5. Connect your Samsung phone via USB (enable USB debugging in Developer Options)
6. Click the green "Run" button (or Shift+F10)
7. Select your phone as the deployment target

## How to Generate a Sideloadable APK

1. In Android Studio, go to Build > Build Bundle(s) / APK(s) > Build APK(s)
2. The APK will be at: `app/build/outputs/apk/debug/app-debug.apk`
3. Transfer this APK to your phone and install it

## Project Structure

```
app/src/main/
  AndroidManifest.xml              - Permissions + receivers + services
  java/com/aurea/sms/
    AureaApp.kt                    - Application class, schedules WorkManager
    ui/
      MainActivity.kt             - Main screen: status, scan button, event log
      ComposeSmsActivity.kt       - Required stub for default SMS app role
    receiver/
      SmsReceiver.kt              - BroadcastReceiver for incoming SMS
      MmsReceiver.kt              - Required stub for default SMS app role
      HeadlessSmsService.kt       - Required stub for default SMS app role
    worker/
      ScanWorker.kt               - WorkManager task: scans every 15 minutes
    helper/
      DateExtractor.kt            - Local AI: regex-based date/time extraction
      CalendarHelper.kt           - Creates calendar events via CalendarContract
      SmsReader.kt                - Reads SMS inbox/sent + call logs
      EventLog.kt                 - SharedPreferences-based event log + dedup
  res/
    layout/
      activity_main.xml           - Main screen layout
      item_event_log.xml          - Event log list item
    values/
      themes.xml                  - Dark theme with Aurea gold accent
      colors.xml                  - Color definitions
      strings.xml                 - App name
    drawable/
      icon_bg.xml                 - Gold rounded square for icon
```

## How It Works

1. On first launch, tap "Set as Default SMS App" — the system popup appears
2. Grant SMS, Call Log, Contacts, and Calendar permissions when prompted
3. Aurea immediately scans your last 100 messages + 50 calls
4. Every 15 minutes (via WorkManager), it re-scans for new messages
5. New incoming SMS are also processed in real-time via BroadcastReceiver
6. When a message contains scheduling intent (e.g. "meet Friday 7pm"),
   a calendar event is created automatically with a 30-minute reminder
7. The main screen shows a log of all detected and created events

## Date/Time Extraction

The DateExtractor uses local pattern matching (no cloud APIs) to find:
- Explicit times: "7pm", "3:30 PM", "at 10"
- Relative days: "today", "tomorrow", "tmrw"
- Day names: "Monday", "this Friday", "next Wed"
- Date formats: "3/15", "03-15-2026"
- Event keywords: "meet", "lunch", "dinner", "appointment", "call", etc.

A message must contain BOTH a time/date reference AND an event keyword
to trigger calendar event creation.

## Important Notes

- The app must be set as default SMS to read messages — this is an Android requirement
- Setting Aurea as default means your regular messaging app temporarily loses default status
- You can switch back anytime in Settings > Apps > Default apps > SMS app
- All processing is 100% local — no data leaves your phone
- Min SDK 29 (Android 10), Target SDK 36
>>>>>>> origin/main
