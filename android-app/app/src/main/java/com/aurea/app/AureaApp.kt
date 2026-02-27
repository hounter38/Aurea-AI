package com.aurea.app

import android.app.Application
import androidx.work.*
import com.aurea.app.workers.ScanWorker
import java.util.concurrent.TimeUnit

class AureaApp : Application() {
    override fun onCreate() {
        super.onCreate()
        schedulePeriodicScan()
    }

    /**
     * Schedules a background scan every 15 minutes.
     * This catches any SMS that the BroadcastReceiver might have missed
     * (e.g. if the app was killed, or messages arrived during Doze mode).
     */
    private fun schedulePeriodicScan() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val scanRequest = PeriodicWorkRequestBuilder<ScanWorker>(15, TimeUnit.MINUTES)
            .setConstraints(constraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 1, TimeUnit.MINUTES)
            .build()

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "aurea_sms_scan",
            ExistingPeriodicWorkPolicy.KEEP,
            scanRequest
        )
    }
}
