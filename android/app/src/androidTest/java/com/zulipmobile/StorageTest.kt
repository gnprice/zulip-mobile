package com.zulipmobile

//import android.test.AndroidTestCase

import androidx.test.filters.SmallTest
import androidx.test.runner.AndroidJUnit4
import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.bridge.JavaScriptModule
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.modules.appstate.AppStateModule
import com.facebook.react.modules.core.ReactChoreographer
import com.facebook.react.modules.deviceinfo.DeviceInfoModule
import com.facebook.react.testing.FakeWebSocketModule
import com.facebook.react.testing.ReactIntegrationTestCase
import com.facebook.react.testing.ReactTestHelper
import com.facebook.react.testing.StringRecordingModule
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.views.view.ReactViewManager
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import java.util.*

@SmallTest
@RunWith(AndroidJUnit4::class)
class StorageTest: ReactIntegrationTestCase() {
    @Test
    fun smoke() {
        Assert.assertEquals("foo", "foo")
    }

    @Test
    fun fire() {
        Assert.assertEquals("foo", "bar")
    }

    private interface TestJSLocaleModule : JavaScriptModule {
        fun toUpper(string: String?)
        fun toLower(string: String?)
    }

    var mStringRecordingModule: StringRecordingModule? = null

    private var mInstance: CatalystInstance? = null

    @Throws(Exception::class)
    override fun setUp() {
        super.setUp()

        val viewManagers = Arrays.asList<ViewManager<*, *>>(ReactViewManager())
        val mUIManager = UIManagerModule(context, viewManagers, 0)
        UiThreadUtil.runOnUiThread {
            ReactChoreographer.initialize()
            mUIManager.onHostResume()
        }
        waitForIdleSync()

        mStringRecordingModule = StringRecordingModule()
        mInstance = ReactTestHelper.catalystInstanceBuilder(this)
            .addNativeModule(mStringRecordingModule)
            .addNativeModule(mUIManager)
            .addNativeModule(DeviceInfoModule(context))
            .addNativeModule(AppStateModule(context))
            .addNativeModule(FakeWebSocketModule())
            .build()
    }

    @Test
    fun testToUpper() {
        setUp()

        val testModule = mInstance!!.getJSModule(TestJSLocaleModule::class.java)
        waitForBridgeAndUIIdle()

        testModule.toUpper("test")
        testModule.toUpper("W niżach mógł zjeść truflę koń bądź psy")
        testModule.toUpper("Шеф взъярён тчк щипцы с эхом гудбай Жюль")
        testModule.toUpper("Γαζίες καὶ μυρτιὲς δὲν θὰ βρῶ πιὰ στὸ χρυσαφὶ ξέφωτο")
        testModule.toUpper("chinese: 幓 厏吪吙 鈊釿閍 碞碠粻 曮禷")
        waitForBridgeAndUIIdle()

        val answers = mStringRecordingModule!!.calls.toTypedArray()
        Assert.assertEquals("TEST", answers[0])
        Assert.assertEquals("W NIŻACH MÓGŁ ZJEŚĆ TRUFLĘ KOŃ BĄDŹ PSY", answers[1])
        Assert.assertEquals("ШЕФ ВЗЪЯРЁН ТЧК ЩИПЦЫ С ЭХОМ ГУДБАЙ ЖЮЛЬ", answers[2])
        Assert.assertEquals("ΓΑΖΊΕΣ ΚΑῚ ΜΥΡΤΙῈΣ ΔῈΝ ΘᾺ ΒΡΩ͂ ΠΙᾺ ΣΤῸ ΧΡΥΣΑΦῚ ΞΈΦΩΤΟ",
            answers[3])
        Assert.assertEquals("CHINESE: 幓 厏吪吙 鈊釿閍 碞碠粻 曮禷", answers[4])
    }

}
