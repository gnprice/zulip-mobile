package com.zulipmobile

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteException
import java.io.File

class ZulipDb(private val context: Context) {
    private val mDbOpenHelper = ZulipDbOpenHelper(context)
    private val db get() = mDbOpenHelper.getReadableDatabase()
    private val store get() = ZulipKeyValueStore(db)

    // TODO app-level getters here, using `store.getItem`
}

private class ZulipKeyValueStore(private val db: SQLiteDatabase) {
    fun getItem(key: String): Any? {
        val serialized = getItemSerialized(key) ?: return null
        return JSONTokener(serialized).nextValue()
    }

    private fun getItemSerialized(key: String): String? {
        return getItemDecompressed(encodeKey(key))
    }

    // The `KEY_PREFIX` in src/third/redux-persist/constants.js .
    private val reduxPersistKeyPrefix = "reduxPersist:"

    // Corresponds to createStorageKey in src/third/redux-persist/getStoredState.js .
    private fun encodeKey(key: String) = reduxPersistKeyPrefix + key

    /// Corresponds to CompressedAsyncStorage.getItem in src/storage/CompressedAsyncStorage.js.
    private fun getItemDecompressed(key: String): String? {
        val raw = getItemRaw(key) ?: return null
        return decompressIfCompressed(raw)
    }

    /// Corresponds to AsyncStorage.getItem in src/storage/AsyncStorage.js.
    private fun getItemRaw(key: String): String? {
        val cur = db.query("keyvalue",
            arrayOf("value"), "key = ?", arrayOf(key),
            null, null, null)
        cur.moveToFirst()
        if (cur.isAfterLast) return null
        val value = cur.getString(0)
        cur.close()
        return value
    }
}

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
