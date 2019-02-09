package com.zulipmobile.notifications;

import android.content.Context;
import com.facebook.react.ReactApplication;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import com.zulipmobile.MainApplication;
import com.zulipmobile.notifications.NotificationHelper.ConversationMap;

public class FcmListenerService extends FirebaseMessagingService {
    /**
     * Called by the Firebase framework when the InstanceID token is updated.
     *
     * Mainly this means on first registration, but the framework
     * might choose to rotate the token later.
     */
    @Override
    public void onNewToken(String token) {
        NotificationsModule.emitToken((ReactApplication) getApplication(), token);
    }

    @Override
    public void onMessageReceived(RemoteMessage message) {
        final Context applicationContext = getApplicationContext();
        if (!(applicationContext instanceof MainApplication)) {
            return;
        }
        final ConversationMap conversations =
                ((MainApplication) applicationContext).getConversations();
        FCMPushNotifications.onReceived(this, conversations, message.getData());
    }
}
