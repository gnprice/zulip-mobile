package com.zulipmobile

import android.app.Activity
import android.app.Application
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

// This (and the `@Config(application = …)` using it) avoid an issue with Flipper:
//   https://github.com/facebook/flipper/issues/1531#issuecomment-711436762
class TestApplication: Application() {}

@RunWith(RobolectricTestRunner::class)
@Config(application = TestApplication::class)
class ZulipKeyValueStoreTest {
    @Test
    fun `tmp test`() {
        val controller = Robolectric.buildActivity(Activity::class.java)
        controller.setup()
        val activity = controller.get()

        val h = ZulipDbOpenHelper(activity)
        val db = h.getReadableDatabase()
        val cur = db.query("sqlite_master", arrayOf("tblname"), "true", arrayOf(), null, null, null)
        cur.close()
    }
}