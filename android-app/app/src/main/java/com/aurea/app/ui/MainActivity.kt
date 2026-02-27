package com.aurea.app.ui

import android.Manifest
import android.app.role.RoleManager
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.aurea.app.BuildConfig
import com.aurea.app.R
import com.aurea.app.helpers.AureaApiClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {

    private lateinit var statusText: TextView
    private lateinit var serverStatus: TextView
    private lateinit var logText: TextView
    private lateinit var permissionBtn: Button

    private val requiredPermissions = arrayOf(
        Manifest.permission.READ_SMS,
        Manifest.permission.RECEIVE_SMS,
        Manifest.permission.READ_CALL_LOG,
        Manifest.permission.READ_CONTACTS,
        Manifest.permission.READ_CALENDAR,
        Manifest.permission.WRITE_CALENDAR,
    ).let {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            it + Manifest.permission.POST_NOTIFICATIONS
        } else it
    }

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        val allGranted = results.all { it.value }
        updatePermissionStatus(allGranted)
        if (allGranted) {
            addLog("All permissions granted — Aurea is now monitoring your messages automatically")
        } else {
            val denied = results.filter { !it.value }.keys.joinToString(", ") { it.substringAfterLast(".") }
            addLog("Missing permissions: $denied")
        }
    }

    private val smsRoleLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            addLog("Aurea is now the default SMS app")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        statusText = findViewById(R.id.statusText)
        serverStatus = findViewById(R.id.serverStatus)
        logText = findViewById(R.id.logText)
        permissionBtn = findViewById(R.id.permissionBtn)

        permissionBtn.setOnClickListener { requestAllPermissions() }

        findViewById<Button>(R.id.defaultSmsBtn).setOnClickListener { requestDefaultSms() }
        findViewById<Button>(R.id.checkServerBtn).setOnClickListener { checkServer() }

        checkPermissions()
        checkServer()

        addLog("Aurea started")
        addLog("Backend: ${BuildConfig.API_BASE_URL}")
        addLog("Background scan: every 15 minutes")
        addLog("Real-time SMS interception: active (when permissions granted)")
    }

    private fun checkPermissions() {
        val allGranted = requiredPermissions.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }
        updatePermissionStatus(allGranted)
    }

    private fun updatePermissionStatus(allGranted: Boolean) {
        if (allGranted) {
            statusText.text = "ACTIVE — Monitoring messages automatically"
            statusText.setTextColor(ContextCompat.getColor(this, android.R.color.holo_green_light))
            permissionBtn.text = "Permissions: All Granted ✓"
            permissionBtn.isEnabled = false
        } else {
            statusText.text = "SETUP REQUIRED — Grant permissions to start"
            statusText.setTextColor(ContextCompat.getColor(this, android.R.color.holo_orange_light))
            permissionBtn.text = "Grant All Permissions"
            permissionBtn.isEnabled = true
        }
    }

    private fun requestAllPermissions() {
        permissionLauncher.launch(requiredPermissions)
    }

    private fun requestDefaultSms() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = getSystemService(RoleManager::class.java)
            if (roleManager.isRoleAvailable(RoleManager.ROLE_SMS) &&
                !roleManager.isRoleHeld(RoleManager.ROLE_SMS)
            ) {
                smsRoleLauncher.launch(roleManager.createRequestRoleIntent(RoleManager.ROLE_SMS))
            } else {
                Toast.makeText(this, "Already set as default or not available", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun checkServer() {
        lifecycleScope.launch {
            serverStatus.text = "Checking server..."
            val reachable = withContext(Dispatchers.IO) { AureaApiClient.checkHealth() }
            if (reachable) {
                serverStatus.text = "Server: Connected ✓"
                serverStatus.setTextColor(ContextCompat.getColor(this@MainActivity, android.R.color.holo_green_light))
                addLog("Backend server is reachable")
            } else {
                serverStatus.text = "Server: Not reachable ✗"
                serverStatus.setTextColor(ContextCompat.getColor(this@MainActivity, android.R.color.holo_red_light))
                addLog("Cannot reach backend at ${BuildConfig.API_BASE_URL}")
            }
        }
    }

    private fun addLog(msg: String) {
        val time = java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.US).format(java.util.Date())
        logText.append("[$time] $msg\n")
    }
}
