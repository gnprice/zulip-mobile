package com.zulipmobile

import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ZulipKeyValueStoreTest {
    @Test
    fun `tmp test`() {
        val controller = Robolectric.buildActivity(MainActivity::class.java)
        controller.setup()
        val activity = controller.get()

        val h = ZulipDbOpenHelper(activity)
        val db = h.getReadableDatabase()
        val cur = db.query("sqlite_master", arrayOf("tblname"), "true", arrayOf(), null, null, null)
        cur.close()
    }
}