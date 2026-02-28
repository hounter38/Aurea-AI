package com.aurea.sms

import android.app.Application
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.aurea.sms.worker.ScanWorker
import java.util.concurrent.TimeUnit

class AureaApp : Application() {

    override fun onCreate() {
        super.onCreate()
        schedulePeriodicScan()
    }

    private fun schedulePeriodicScan() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.NOT_REQUIRED)
            .build()

        val scanRequest = PeriodicWorkRequestBuilder<ScanWorker>(
            15, TimeUnit.MINUTES
        )
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "aurea_sms_scan",
            ExistingPeriodicWorkPolicy.KEEP,
            scanRequest
        )
    }
}
