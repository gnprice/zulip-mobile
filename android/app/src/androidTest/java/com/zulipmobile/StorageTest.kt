package com.zulipmobile

//import android.test.AndroidTestCase
import androidx.test.filters.SmallTest
import androidx.test.runner.AndroidJUnit4
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.Assert

//import com.facebook.react.testing.ReactIntegrationTestCase;

//class StorageTest: ReactIntegrationTestCase {
@SmallTest
@RunWith(AndroidJUnit4::class)
class StorageTest {
    @Test
    fun smoke() {
        Assert.assertEquals("foo", "foo")
    }

    @Test
    fun fire() {
        Assert.assertEquals("foo", "bar")
    }
}
