// @flow

declare var messages: string[];
declare var pmKeyRecipientUsersFromMessage: (...mixed[]) => null | number[];
declare var unreadPms: { [string]: number };
declare var debug: $Flow$DebugPrint;

const recipients = messages
  .map(msg => {
    // Note this can be a different set of users from those in `keyRecipients`.
    const unreadsKey = 'key';
    const keyRecipients = pmKeyRecipientUsersFromMessage(msg);
    return keyRecipients === null ? null : { unreadsKey, keyRecipients, msgId: msg };
  })
  .filter(Boolean);

const latestByRecipient = new Map();
recipients.forEach(recipient => {
  const prev = latestByRecipient.get(recipient.unreadsKey);
  if (!prev || recipient.msgId > prev.msgId) {
    latestByRecipient.set(recipient.unreadsKey, recipient);
  }
});

const sortedByMostRecent = Array.from(latestByRecipient.values()).sort(
  (a, b) => +b.msgId - +a.msgId,
);

const ret = sortedByMostRecent.map(recipient => ({
  key: recipient.unreadsKey,
  keyRecipients: recipient.keyRecipients,
  msgId: recipient.msgId,
  unread: unreadPms[recipient.unreadsKey],
}));

// The IDE says `recipient.unreadsKey` here is `any | string`,
// and `npx flow type-at-pos` says the same.
// But the debug output says it's a string, just as you'd hope.
// And if you try *using* it, it does catch errors just fine.
sortedByMostRecent.map(recipient => debug(recipient.unreadsKey));
