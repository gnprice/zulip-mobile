package com.zulipmobile.notifications;

import android.os.Bundle;
import android.support.annotation.NonNull;
import android.util.Log;
import com.facebook.react.ReactApplication;
import com.facebook.react.bridge.*;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.iid.InstanceIdResult;

import static com.zulipmobile.notifications.NotificationHelper.TAG;

public class NotificationsModule extends ReactContextBaseJavaModule {

    static Bundle initialNotification = null;

    NotificationsModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "Notifications";
    }

    @Override
    public void initialize() {
        // Invoking `emitToken` here is a bit belt-and-suspenders: the FCM framework
        // already invokes it (via `onNewToken`) at app startup.  But that can be
        // before React is ready.  With some more care we could hang on to it and emit
        // the event a bit later, but instead we just redundantly emit here when we
        // know things have started up.
        getAndEmitToken((ReactApplication) getCurrentActivity().getApplication());
    }

    private static void getAndEmitToken(final ReactApplication application) {
        FirebaseInstanceId.getInstance().getInstanceId()
            .addOnCompleteListener(new OnCompleteListener<InstanceIdResult>() {
                @Override
                public void onComplete(@NonNull Task<InstanceIdResult> task) {
                    if (!task.isSuccessful()) {
                        Log.w(TAG, "getInstanceId failed", task.getException());
                        return;
                    }
                    emitToken(application, task.getResult().getToken());
                }
            });
    }

    static void emitToken(ReactApplication application, String token) {
        final ReactContext reactContext =
                application
                        .getReactNativeHost()
                        .getReactInstanceManager()
                        .getCurrentReactContext();
        if (reactContext == null) {
            // Perhaps this is possible if onNewToken gets invoked?
            // If so, the next time the app is launched, this method will be invoked again
            // by our NotificationsModule#initialize, by which point there certainly is
            // a React context; so we'll learn the new token then.
            Log.w(TAG, "Got token before React context initialized");
            return;
        }
        Log.i(TAG, "Got token; emitting event");
        NotifyReact.emit(reactContext, "remoteNotificationsRegistered", token);
    }

    @ReactMethod
    public void getInitialNotification(Promise promise) {
        if (null == initialNotification) {
            promise.resolve(null);
        } else {
            promise.resolve(Arguments.fromBundle(initialNotification));
        }
    }
}
