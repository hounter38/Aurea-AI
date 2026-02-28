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
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var statusText: TextView
    private lateinit var todayCountText: TextView
    private lateinit var defaultSmsButton: Button
    private lateinit var grantPermissionsButton: Button
    private lateinit var scanNowButton: Button
    private lateinit var recyclerView: RecyclerView
    private lateinit var emptyText: TextView
    private lateinit var warningCard: View

    private val requiredPermissions = arrayOf(
        Manifest.permission.READ_SMS,
        Manifest.permission.RECEIVE_SMS,
        Manifest.permission.SEND_SMS,
        Manifest.permission.READ_CALL_LOG,
        Manifest.permission.READ_CONTACTS,
        Manifest.permission.READ_CALENDAR,
        Manifest.permission.WRITE_CALENDAR
    )

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
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
        todayCountText = findViewById(R.id.todayCountText)
        defaultSmsButton = findViewById(R.id.defaultSmsButton)
        grantPermissionsButton = findViewById(R.id.grantPermissionsButton)
        scanNowButton = findViewById(R.id.scanNowButton)
        recyclerView = findViewById(R.id.eventLogRecycler)
        emptyText = findViewById(R.id.emptyText)
        warningCard = findViewById(R.id.warningCard)

        recyclerView.layoutManager = LinearLayoutManager(this)

        defaultSmsButton.setOnClickListener { requestDefaultSms() }
        grantPermissionsButton.setOnClickListener { requestPermissions() }
        scanNowButton.setOnClickListener { runManualScan() }

        updateUI()
    }

    override fun onResume() {
        super.onResume()
        updateUI()
    }

    private fun isDefaultSmsApp(): Boolean {
        return Telephony.Sms.getDefaultSmsPackage(this) == packageName
    }

    private fun hasAllPermissions(): Boolean {
        return requiredPermissions.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun requestDefaultSms() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = getSystemService(RoleManager::class.java)
            if (roleManager.isRoleAvailable(RoleManager.ROLE_SMS)) {
                val intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_SMS)
                smsRoleLauncher.launch(intent)
                return
            }
        }

        val intent = Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS)
        startActivity(intent)
    }

    private fun requestPermissions() {
        val missing = requiredPermissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }.toTypedArray()

        if (missing.isNotEmpty()) {
            permissionLauncher.launch(missing)
        }
    }

    private fun updateUI() {
        val isDefault = isDefaultSmsApp()
        val hasPerms = hasAllPermissions()

        if (!isDefault) {
            warningCard.visibility = View.VISIBLE
            statusText.text = "Not set as default messaging app"
            statusText.setTextColor(ContextCompat.getColor(this, android.R.color.holo_red_dark))
            defaultSmsButton.visibility = View.VISIBLE
            grantPermissionsButton.visibility = View.GONE
            scanNowButton.isEnabled = false
        } else if (!hasPerms) {
            warningCard.visibility = View.VISIBLE
            statusText.text = "Permissions needed"
            statusText.setTextColor(ContextCompat.getColor(this, android.R.color.holo_orange_dark))
            defaultSmsButton.visibility = View.GONE
            grantPermissionsButton.visibility = View.VISIBLE
            scanNowButton.isEnabled = false
        } else {
            warningCard.visibility = View.GONE
            statusText.text = "Active — scanning messages automatically"
            statusText.setTextColor(ContextCompat.getColor(this, android.R.color.holo_green_dark))
            defaultSmsButton.visibility = View.GONE
            grantPermissionsButton.visibility = View.GONE
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
        scanNowButton.isEnabled = false
        scanNowButton.text = "Scanning..."

        Thread {
            try {
                val messages = SmsReader.readRecentMessages(this, 100)
                val dateFormat = SimpleDateFormat("MMM dd, yyyy h:mm a", Locale.getDefault())
                val nowFormat = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())
                var found = 0

                for (msg in messages) {
                    if (EventLog.isProcessed(this, msg.id)) continue

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

                runOnUiThread {
                    scanNowButton.isEnabled = true
                    scanNowButton.text = "Scan Now"
                    todayCountText.text = "Scan complete — found $found new date${if (found != 1) "s" else ""}"
                    updateUI()
                }
            } catch (e: Exception) {
                e.printStackTrace()
                runOnUiThread {
                    scanNowButton.isEnabled = true
                    scanNowButton.text = "Scan Now"
                    statusText.text = "Scan failed: ${e.message}"
                }
            }
        }.start()
    }

    // RecyclerView adapter for event log entries
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
