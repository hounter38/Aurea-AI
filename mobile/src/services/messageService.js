import { Platform, PermissionsAndroid } from "react-native";

const API_URL = __DEV__
  ? Platform.select({
      android: "http://10.0.2.2:4000",
      ios: "http://localhost:4000",
      default: "http://localhost:4000",
    })
  : "https://api.aurea.app";

export async function requestSmsPermissions() {
  if (Platform.OS !== "android") return false;

  try {
    const grants = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
    ]);

    return Object.values(grants).every(
      (g) => g === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch {
    return false;
  }
}

export async function sendSmsToBackend(sender, body) {
  const res = await fetch(`${API_URL}/api/messages/sms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sender,
      body,
      timestamp: new Date().toISOString(),
      device_platform: Platform.OS,
    }),
  });
  return res.json();
}

export async function sendCallToBackend(caller, transcript, durationSeconds) {
  const res = await fetch(`${API_URL}/api/messages/call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      caller,
      transcript,
      duration_seconds: durationSeconds,
      timestamp: new Date().toISOString(),
      device_platform: Platform.OS,
    }),
  });
  return res.json();
}

export async function processMessage(messageId) {
  const res = await fetch(`${API_URL}/api/process/${messageId}`, {
    method: "POST",
  });
  return res.json();
}
