/**
 * The view-model for showing the user's unreads.
 *
 * @flow strict-local
 */

/**
 * An item in the data prepared for this UI by its helper selectors.
 *
 * See `getUnreadStreamsAndTopicsSansMuted`, and its helper
 * `getUnreadStreamsAndTopics`.
 *
 * The exact collection of data included here is just an assortment of what
 * the UI in this file happens to need.
 */
export type UnreadStreamItem = {|
  key: string,
  streamId: number,
  streamName: string,
  unread: number,
  color: string,
  isMuted: boolean,
  isPinned: boolean,
  isPrivate: boolean,
  isWebPublic: boolean | void,
  data: $ReadOnlyArray<{|
    key: string,
    topic: string,
    unread: number,
    isMuted: boolean,
    lastUnreadMsgId: number,
  |}>,
|};
