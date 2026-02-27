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
