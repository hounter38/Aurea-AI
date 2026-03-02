package com.aurea.sms.ui

import android.Manifest
import android.app.role.RoleManager
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.provider.Telephony
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.aurea.sms.R
import com.aurea.sms.helper.DateExtractor
import com.aurea.sms.helper.CalendarHelper
import com.aurea.sms.helper.EventLog
import com.aurea.sms.helper.EventLogEntry
import com.aurea.sms.helper.SmsReader
import com.aurea.sms.network.AureaApiClient
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "AureaMainActivity"
    }

    private lateinit var statusText: TextView
    private lateinit var serverStatusText: TextView
    private lateinit var todayCountText: TextView
    private lateinit var defaultSmsButton: Button
    private lateinit var grantPermissionsButton: Button
    private lateinit var scanNowButton: Button
    private lateinit var recyclerView: RecyclerView
    private lateinit var emptyText: TextView
    private lateinit var warningCard: View
    private lateinit var activeCard: View

    private val smsPermissions = arrayOf(
        Manifest.permission.READ_SMS,
        Manifest.permission.RECEIVE_SMS
    )

    private val allPermissions = arrayOf(
        Manifest.permission.READ_SMS,
        Manifest.permission.RECEIVE_SMS,
        Manifest.permission.SEND_SMS,
        Manifest.permission.READ_CONTACTS,
        Manifest.permission.READ_CALENDAR,
        Manifest.permission.WRITE_CALENDAR
    )

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        Log.d(TAG, "Permission results: $results")
        updateUI()
    }

    private val smsRoleLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        updateUI()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        statusText = findViewById(R.id.statusText)
        serverStatusText = findViewById(R.id.serverStatusText)
        todayCountText = findViewById(R.id.todayCountText)
        defaultSmsButton = findViewById(R.id.defaultSmsButton)
        grantPermissionsButton = findViewById(R.id.grantPermissionsButton)
        scanNowButton = findViewById(R.id.scanNowButton)
        recyclerView = findViewById(R.id.eventLogRecycler)
        emptyText = findViewById(R.id.emptyText)
        warningCard = findViewById(R.id.warningCard)
        activeCard = findViewById(R.id.activeCard)

        recyclerView.layoutManager = LinearLayoutManager(this)

        defaultSmsButton.setOnClickListener { openAppSettings() }
        grantPermissionsButton.setOnClickListener { requestAllPermissions() }
        scanNowButton.setOnClickListener { runManualScan() }

        if (!hasSmsPermissions()) {
            Log.d(TAG, "SMS permissions missing, requesting on launch")
            requestAllPermissions()
        }

        updateUI()
        checkServerConnection()
    }

    override fun onResume() {
        super.onResume()
        updateUI()
        checkServerConnection()
    }

    private fun checkServerConnection() {
        serverStatusText.text = "Server: Checking..."
        serverStatusText.setTextColor(ContextCompat.getColor(this, android.R.color.darker_gray))

        Thread {
            val (healthy, detail) = AureaApiClient.checkHealth(this)
            runOnUiThread {
                if (healthy) {
                    serverStatusText.text = "Server: Connected"
                    serverStatusText.setTextColor(0xFF4ADE80.toInt())
                } else {
                    serverStatusText.text = "Server: Offline ($detail)"
                    serverStatusText.setTextColor(0xFFEF4444.toInt())
                }
            }
        }.start()
    }

    private fun hasSmsPermissions(): Boolean {
        return smsPermissions.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun hasAllPermissions(): Boolean {
        return allPermissions.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun requestAllPermissions() {
        val missing = allPermissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }.toTypedArray()

        if (missing.isNotEmpty()) {
            Log.d(TAG, "Requesting permissions: ${missing.joinToString()}")
            permissionLauncher.launch(missing)
        }
    }

    private fun openAppSettings() {
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.parse("package:$packageName")
        }
        startActivity(intent)
    }

    private fun updateUI() {
        val hasSms = hasSmsPermissions()
        val hasAll = hasAllPermissions()

        Log.d(TAG, "updateUI: hasSms=$hasSms, hasAll=$hasAll")

        if (!hasSms) {
            warningCard.visibility = View.VISIBLE
            activeCard.visibility = View.GONE
            statusText.text = "Aurea needs SMS access to automatically detect events from your messages"
            statusText.setTextColor(0xFFEF4444.toInt())
            defaultSmsButton.visibility = View.GONE
            grantPermissionsButton.visibility = View.VISIBLE
            grantPermissionsButton.text = "Grant SMS Permissions"
            scanNowButton.isEnabled = false
        } else if (!hasAll) {
            warningCard.visibility = View.VISIBLE
            activeCard.visibility = View.VISIBLE
            statusText.text = "SMS listening is active! Grant remaining permissions for calendar and contacts."
            statusText.setTextColor(0xFFFACC15.toInt())
            defaultSmsButton.visibility = View.GONE
            grantPermissionsButton.visibility = View.VISIBLE
            grantPermissionsButton.text = "Grant Remaining Permissions"
            scanNowButton.isEnabled = true
        } else {
            warningCard.visibility = View.GONE
            activeCard.visibility = View.VISIBLE
            scanNowButton.isEnabled = true
        }

        val todayCount = EventLog.getTodayCount(this)
        todayCountText.text = "Found $todayCount date${if (todayCount != 1) "s" else ""} today"

        val entries = EventLog.getEntries(this)
        if (entries.isEmpty()) {
            emptyText.visibility = View.VISIBLE
            recyclerView.visibility = View.GONE
        } else {
            emptyText.visibility = View.GONE
            recyclerView.visibility = View.VISIBLE
            recyclerView.adapter = EventLogAdapter(entries)
        }
    }

    private fun runManualScan() {
        if (!hasSmsPermissions()) {
            requestAllPermissions()
            return
        }

        scanNowButton.isEnabled = false
        scanNowButton.text = "Scanning..."
        Log.d(TAG, "Starting manual scan")

        Thread {
            try {
                val messages = SmsReader.readRecentMessages(this, 100)
                val dateFormat = SimpleDateFormat("MMM dd, yyyy h:mm a", Locale.getDefault())
                val nowFormat = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())
                var found = 0
                var forwarded = 0

                for (msg in messages) {
                    if (EventLog.isProcessed(this, msg.id)) continue

                    val sent = AureaApiClient.sendSms(this, msg.body, msg.sender)
                    if (sent) forwarded++

                    val events = DateExtractor.extractEvents(msg.body, "SMS from ${msg.sender}")

                    for (event in events) {
                        val eventId = CalendarHelper.addEvent(
                            this,
                            event.title,
                            event.description,
                            event.startTime,
                            event.endTime
                        )

                        if (eventId != null) {
                            EventLog.addEntry(
                                this,
                                EventLogEntry(
                                    title = event.title,
                                    dateTime = dateFormat.format(event.startTime.time),
                                    source = event.source,
                                    addedAt = nowFormat.format(Date())
                                )
                            )
                            found++
                        }
                    }

                    EventLog.markProcessed(this, msg.id)
                }

                Log.d(TAG, "Scan complete: found=$found dates, forwarded=$forwarded messages")

                runOnUiThread {
                    scanNowButton.isEnabled = true
                    scanNowButton.text = "Scan Now"
                    todayCountText.text = "Scan done — $forwarded sent to AI, $found dates found locally"
                    updateUI()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Scan failed", e)
                runOnUiThread {
                    scanNowButton.isEnabled = true
                    scanNowButton.text = "Scan Now"
                    statusText.text = "Scan failed: ${e.message}"
                    statusText.setTextColor(0xFFEF4444.toInt())
                }
            }
        }.start()
    }

    inner class EventLogAdapter(
        private val entries: List<EventLogEntry>
    ) : RecyclerView.Adapter<EventLogAdapter.ViewHolder>() {

        inner class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val titleText: TextView = view.findViewById(R.id.logTitle)
            val dateText: TextView = view.findViewById(R.id.logDate)
            val sourceText: TextView = view.findViewById(R.id.logSource)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_event_log, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val entry = entries[position]
            holder.titleText.text = entry.title
            holder.dateText.text = entry.dateTime
            holder.sourceText.text = entry.source
        }

        override fun getItemCount() = entries.size
    }
}
