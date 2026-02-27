package com.aurea.app.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.work.*
import com.aurea.app.workers.ScanWorker
import java.util.concurrent.TimeUnit

/**
 * Restarts the periodic scan after phone reboot.
 * Ensures Aurea keeps working even after the phone restarts.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return

        Log.d("AureaBootReceiver", "Phone rebooted — restarting Aurea background scan")

        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val scanRequest = PeriodicWorkRequestBuilder<ScanWorker>(15, TimeUnit.MINUTES)
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            "aurea_sms_scan",
            ExistingPeriodicWorkPolicy.KEEP,
            scanRequest
        )
    }
}
