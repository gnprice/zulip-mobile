package com.zulipmobile.notifications;

import android.os.Bundle;

import com.wix.reactnativenotifications.core.notification.PushNotificationProps;

import java.util.Arrays;

public class PushNotificationsProp extends PushNotificationProps {

    PushNotificationsProp(Bundle bundle) {
        super(bundle);
    }

    /** Really "event type": one of a small fixed set of identifiers. */
    String getEvent() {
        return mBundle.getString("event");
    }

    String getRecipientType() {
        return mBundle.getString("recipient_type");
    }

    public String getContent() {
        return mBundle.getString("content");
    }

    String getSenderFullName() {
        return mBundle.getString("sender_full_name");
    }

    String getAvatarURL() {
        return mBundle.getString("sender_avatar_url");

    }

    String getStream() {
        return mBundle.getString("stream");
    }

    String getTopic() {
        return mBundle.getString("topic");
    }

    public String getTime() {
        return mBundle.getString("time");
    }

    @Override
    protected PushNotificationsProp copy() {
        return new PushNotificationsProp((Bundle) mBundle.clone());
    }

    String getEmail() {
        return mBundle.getString("sender_email");
    }

    String getBaseURL() {
        return mBundle.getString("base_url");
    }

    private int[] getPmUsers() {
        if (mBundle.containsKey("pm_users")){
            return mBundle.getIntArray("pm_users");
        }
        return null;
    }

    boolean isGroupMessage() {
        return getRecipientType().equals("private") && mBundle.containsKey("pm_users");
    }
    String getGroupRecipientString() {
        return Arrays.toString(getPmUsers());
    }

    int getZulipMessageId() {
        return Integer.parseInt(mBundle.getString("zulip_message_id"));
    }
}
