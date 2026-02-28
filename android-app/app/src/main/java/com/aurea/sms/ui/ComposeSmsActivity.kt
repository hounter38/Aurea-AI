package com.aurea.sms.ui

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class ComposeSmsActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Aurea is not a full messaging app. When the user tries to compose
        // an SMS through Aurea, redirect them back to the main screen.
        // This activity exists only to satisfy the default SMS app requirements.
        startActivity(android.content.Intent(this, MainActivity::class.java))
        finish()
    }
}
