package com.zulipmobile

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteException
import java.io.File

// Based loosely on android.database.sqlite.SQLiteOpenHelper .
class ZulipDbOpenHelper(private val context: Context) {
    companion object {
        const val DATABASE_NAME = "zulip.db"
        const val DATABASE_VERSION = 0
    }

    private var mDatabase: SQLiteDatabase? = null;

    fun getReadableDatabase(): SQLiteDatabase {
        synchronized(this) {
            return getDatabaseLocked()
        }
    }

    private fun getDatabaseLocked(): SQLiteDatabase {
        var db = mDatabase
        if (db != null) {
            if (db.isOpen()) return db
            // Not open ⇒ the user must have closed it directly with SQLiteDatabase#close().
            db = null; mDatabase = null
        }

        try {
            val path = getDatabasePath()
            val params =
                SQLiteDatabase.OpenParams.Builder()
                    .addOpenFlags(SQLiteDatabase.OPEN_READONLY)
                    .build()
            db = SQLiteDatabase.openDatabase(path, params)

            val version = getVersion(db)
            if (version != DATABASE_VERSION)
                throw SQLiteException("Database needs migration; got version $version, need $DATABASE_VERSION")

            mDatabase = db
            return db
        } finally {
            // Somehow the inspector is convinced, wrongly, that always `db == null` here.
            @Suppress("SENSELESS_COMPARISON")
            if (db != null && db != mDatabase) {
                @Suppress("UNREACHABLE_CODE")
                db.close()
            }
        }
    }

    private fun getDatabasePath(): File {
        // Cf expo-sqlite:android/src/main/java/expo/modules/sqlite/SQLiteModule.kt pathForDatabaseName
        val directory = context.filesDir.resolve("SQLite")
        return directory.resolve(DATABASE_NAME)
    }

    private fun getVersion(db: SQLiteDatabase): Int {
        return 0 // TODO inspect state.migrations.version
    }
}
