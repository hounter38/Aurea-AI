package com.aurea.sms.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class MmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        // Required for default SMS app role. MMS handling is a no-op for Aurea
        // since we only care about text content for date extraction.
    }
}
