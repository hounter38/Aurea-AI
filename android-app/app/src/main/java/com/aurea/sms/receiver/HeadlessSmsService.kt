package com.aurea.sms.receiver

import android.app.Service
import android.content.Intent
import android.os.IBinder

class HeadlessSmsService : Service() {
    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Required for default SMS app role. No action needed.
        stopSelf()
        return START_NOT_STICKY
    }
}
