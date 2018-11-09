package com.zulipmobile.notifications;

public class MessageInfo {
    private final String content;
    private final int messageId;

    MessageInfo(String content, int messageId) {
        this.content = content;
        this.messageId = messageId;
    }

    String getContent() {
        return content;
    }

    int getMessageId() {
        return messageId;
    }
}
