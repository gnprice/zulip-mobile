/* @flow strict-local */
import type { Narrow, UserOrBot, LocalizableText } from '../types';
import { caseNarrowDefault } from '../utils/narrow';

export default (
  narrow: Narrow,
  ownEmail: string,
  usersByEmail: Map<string, UserOrBot>,
): LocalizableText =>
  caseNarrowDefault(
    narrow,
    {
      groupPm: () => ({ text: 'Message group' }),
      pm: email => {
        if (email === ownEmail) {
          return { text: 'Jot down something' };
        }

        const user = usersByEmail.get(email);
        if (!user) {
          return { text: 'Type a message' };
        }

        return {
          text: 'Message {recipient}',
          values: { recipient: `${user.full_name}` },
        };
      },
      stream: name => ({
        text: 'Message {recipient}',
        values: { recipient: `#${name}` },
      }),
      topic: () => ({ text: 'Reply' }),
    },
    () => ({ text: 'Type a message' }),
  );
