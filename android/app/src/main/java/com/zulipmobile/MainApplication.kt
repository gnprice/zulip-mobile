package com.zulipmobile

import android.app.Application
import android.app.NotificationManager
import android.content.Context
import android.os.Bundle

import android.util.Log
import com.RNFetchBlob.RNFetchBlobPackage
import com.facebook.react.ReactApplication
import com.nikolaiwarner.RNTextInputReset.RNTextInputResetPackage
import com.wix.reactnativenotifications.RNNotificationsPackage
import com.imagepicker.ImagePickerPackage
import com.github.yamill.orientation.OrientationPackage
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.shell.MainReactPackage
import com.facebook.soloader.SoLoader
import com.learnium.RNDeviceInfo.RNDeviceInfo
import com.reactnative.photoview.PhotoViewPackage
import com.remobile.toast.RCTToastPackage
import com.wix.reactnativenotifications.core.AppLaunchHelper
import com.wix.reactnativenotifications.core.AppLifecycleFacade
import com.wix.reactnativenotifications.core.JsIOHelper
import com.wix.reactnativenotifications.core.notification.INotificationsApplication
import com.wix.reactnativenotifications.core.notification.IPushNotification
import com.zmxv.RNSound.RNSoundPackage
import com.zulipmobile.notifications.GCMPushNotifications
import com.zulipmobile.notifications.MessageInfo

import java.util.Arrays
import java.util.LinkedHashMap

import io.sentry.RNSentryPackage

import com.zulipmobile.notifications.GCMPushNotifications.ACTION_NOTIFICATIONS_DISMISS
import com.zulipmobile.notifications.NotificationHelper.clearConversations
import com.zulipmobile.notifications.NotificationHelper

class MainApplication : Application(), ReactApplication, INotificationsApplication {
    private var conversations: LinkedHashMap<String, List<MessageInfo>>? = null

    private val mReactNativeHost = object : ReactNativeHost(this) {
        override fun getUseDeveloperSupport(): Boolean {
            return BuildConfig.DEBUG
        }

        override fun getPackages(): List<ReactPackage> {
            return Arrays.asList(
                    MainReactPackage(),
                    RNTextInputResetPackage(),
                    ImagePickerPackage(),
                    OrientationPackage(),
                    RNSentryPackage(this@MainApplication),
                    PhotoViewPackage(),
                    RCTToastPackage(),
                    RNFetchBlobPackage(),
                    RNSoundPackage(),
                    RNDeviceInfo(),
                    ZulipNativePackage(),
                    RNNotificationsPackage(this@MainApplication)
            )
        }
    }

    override fun getReactNativeHost(): ReactNativeHost {
        return mReactNativeHost
    }

    override fun onCreate() {
        super.onCreate()
        GCMPushNotifications.createNotificationChannel(this)
        SoLoader.init(this, /* native exopackage */ false)
        conversations = LinkedHashMap()
    }

    override fun getPushNotification(context: Context, bundle: Bundle, defaultFacade: AppLifecycleFacade,
                                     defaultAppLaunchHelper: AppLaunchHelper): IPushNotification? {
        bundle.keySet() // Has the side effect of making `bundle.toString` more informative.
        Log.v(NotificationHelper.TAG, "getPushNotification: ${bundle}", Throwable())

        if (ACTION_NOTIFICATIONS_DISMISS == bundle.getString(ACTION_NOTIFICATIONS_DISMISS)) {
            clearConversations(conversations!!)
            val nMgr = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nMgr.cancelAll()
            return null
        } else {
            return GCMPushNotifications(context, bundle, defaultFacade,
                    defaultAppLaunchHelper, JsIOHelper(), conversations)
        }
    }
}
