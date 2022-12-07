package com.zulipmobile

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteException
import java.io.File
import org.json.JSONArray
import org.json.JSONObject
import org.json.JSONTokener

// Many of the JSONObject / JSONArray "optFoo" methods have unsafe semantics:
//   * they "coerce" values, parsing and unparsing strings;
//   * they invent fake data like 0 or "" when no data exists.
// So we supply our own suite, and call them "tryFoo".
fun JSONObject.tryBoolean(name: String): Boolean? = opt(name) as? Boolean
fun JSONObject.tryDouble(name: String): Double? = opt(name) as? Double
fun JSONObject.tryInt(name: String): Int? = opt(name) as? Int
fun JSONObject.tryJSONArray(name: String): JSONArray? = optJSONArray(name)
fun JSONObject.tryJSONObject(name: String): JSONObject? = optJSONObject(name)
fun JSONObject.tryLong(name: String): Long? = opt(name) as? Long
fun JSONObject.tryString(name: String): String? = opt(name) as? String

fun JSONArray.tryBoolean(index: Int): Boolean? = opt(index) as? Boolean
fun JSONArray.tryDouble(index: Int): Double? = opt(index) as? Double
fun JSONArray.tryInt(index: Int): Int? = opt(index) as? Int
fun JSONArray.tryJSONArray(index: Int): JSONArray? = optJSONArray(index)
fun JSONArray.tryJSONObject(index: Int): JSONObject? = optJSONObject(index)
fun JSONArray.tryLong(index: Int): Long? = opt(index) as? Long
fun JSONArray.tryString(index: Int): String? = opt(index) as? String

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
