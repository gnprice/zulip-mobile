/* @flow strict-local */
import md5 from 'blueimp-md5';

import { AvatarURL, GravatarURL, FallbackAvatarURL, UploadedAvatarURL } from '../avatar';
import * as eg from '../../__tests__/lib/exampleData';

describe('AvatarURL', () => {
  describe('fromUserOrBotData', () => {
    const user = eg.makeUser();
    const { email, user_id: userId } = user;
    const realm = eg.realm;

    test('gives a `GravatarURL` if `rawAvatarURL` is null', () => {
      const rawAvatarUrl = null;
      expect(AvatarURL.fromUserOrBotData({ rawAvatarUrl, userId, email, realm })).toBeInstanceOf(
        GravatarURL,
      );
    });

    test('gives a `GravatarURL` if `rawAvatarURL` is a URL string on Gravatar origin', () => {
      const rawAvatarUrl =
        'https://secure.gravatar.com/avatar/2efaec12efd9bea8a089299208117786?d=identicon&version=3';
      expect(AvatarURL.fromUserOrBotData({ rawAvatarUrl, userId, email, realm })).toBeInstanceOf(
        GravatarURL,
      );
    });

    test('gives an `UploadedAvatarURL` if `rawAvatarURL` is a non-Gravatar absolute URL string', () => {
      const rawAvatarUrl =
        'https://zulip-avatars.s3.amazonaws.com/13/430713047f2cffed661f84e139a64f864f17f286?x=x&version=5';
      expect(AvatarURL.fromUserOrBotData({ rawAvatarUrl, userId, email, realm })).toBeInstanceOf(
        UploadedAvatarURL,
      );
    });

    test('gives an `UploadedAvatarURL` if `rawAvatarURL` is a relative URL string', () => {
      const rawAvatarUrl =
        '/user_avatars/2/08fb6d007eb10a56efee1d64760fbeb6111c4352.png?x=x&version=2';
      expect(AvatarURL.fromUserOrBotData({ rawAvatarUrl, userId, email, realm })).toBeInstanceOf(
        UploadedAvatarURL,
      );
    });
  });
});

// Includes `undefined` for no size passed to AvatarURL.get()
const SIZES_WE_USE = [undefined, 24, 32, 80, 200];

describe('GravatarURL', () => {
  test('serializes/deserializes correctly', () => {
    const instance = GravatarURL.validateAndConstructInstance({ email: eg.selfUser.email });

    const roundTripped = GravatarURL.deserialize(GravatarURL.serialize(instance));

    SIZES_WE_USE.forEach(size => {
      expect(instance.get(size).toString()).toEqual(roundTripped.get(size).toString());
    });
  });

  test('lowercases email address before hashing', () => {
    const email = 'uNuSuAlCaPs@example.com';
    const instance = GravatarURL.validateAndConstructInstance({ email });
    expect(instance.get().toString()).toContain(md5('unusualcaps@example.com'));
  });

  test('uses hash from server, if provided', () => {
    const email = 'user13313@chat.zulip.org';
    const hash = md5('cbobbe@zulip.com');
    const instance = GravatarURL.validateAndConstructInstance({ email, hash });
    expect(instance.get().toString()).toContain(hash);
  });

  test('produces corresponding URLs for all sizes', () => {
    const instance = GravatarURL.validateAndConstructInstance({ email: eg.selfUser.email });

    SIZES_WE_USE.filter(s => typeof s === 'number').forEach(size => {
      if (size !== undefined) {
        expect(instance.get(size).toString()).toContain(`s=${size.toString()}`);
      } else {
        expect(instance.get().toString()).not.toContain('s=');
      }
    });
  });
});

describe('UploadedAvatarURL', () => {
  test('serializes/deserializes correctly', () => {
    const instance = UploadedAvatarURL.validateAndConstructInstance({
      realm: eg.realm,
      absoluteOrRelativeUrl:
        'https://zulip-avatars.s3.amazonaws.com/13/430713047f2cffed661f84e139a64f864f17f286?x=x&version=5',
    });

    const roundTripped = UploadedAvatarURL.deserialize(UploadedAvatarURL.serialize(instance));

    SIZES_WE_USE.forEach(size => {
      expect(instance.get(size).toString()).toEqual(roundTripped.get(size).toString());
    });
  });

  test('if a relative URL, gives a URL on the given realm', () => {
    const instance = UploadedAvatarURL.validateAndConstructInstance({
      realm: new URL('https://chat.zulip.org'),
      absoluteOrRelativeUrl:
        '/user_avatars/2/e35cdbc4771c5e4b94e705bf6ff7cca7fa1efcae.png?x=x&version=2',
    });
    expect(instance.get().toString()).toEqual(
      'https://chat.zulip.org/user_avatars/2/e35cdbc4771c5e4b94e705bf6ff7cca7fa1efcae.png?x=x&version=2',
    );
  });

  test('if an absolute URL, just use it', () => {
    const instance = UploadedAvatarURL.validateAndConstructInstance({
      realm: new URL('https://chat.zulip.org'),
      absoluteOrRelativeUrl:
        'https://zulip-avatars.s3.amazonaws.com/13/430713047f2cffed661f84e139a64f864f17f286?x=x&version=5',
    });
    expect(instance.get().toString()).toEqual(
      'https://zulip-avatars.s3.amazonaws.com/13/430713047f2cffed661f84e139a64f864f17f286?x=x&version=5',
    );
  });

  test('converts *.png to *-medium.png for sizes over 100', () => {
    const realm = new URL('https://chat.zulip.org');
    const instance = UploadedAvatarURL.validateAndConstructInstance({
      realm,
      absoluteOrRelativeUrl:
        '/user_avatars/2/e35cdbc4771c5e4b94e705bf6ff7cca7fa1efcae.png?x=x&version=2',
    });
    SIZES_WE_USE.forEach(size => {
      if (size === undefined) {
        expect(instance.get().toString()).toEqual(
          'https://chat.zulip.org/user_avatars/2/e35cdbc4771c5e4b94e705bf6ff7cca7fa1efcae.png?x=x&version=2',
        );
      } else if (size > 100) {
        expect(instance.get(size).toString()).toEqual(
          'https://chat.zulip.org/user_avatars/2/e35cdbc4771c5e4b94e705bf6ff7cca7fa1efcae-medium.png?x=x&version=2',
        );
      } else {
        expect(instance.get(size).toString()).toEqual(
          'https://chat.zulip.org/user_avatars/2/e35cdbc4771c5e4b94e705bf6ff7cca7fa1efcae.png?x=x&version=2',
        );
      }
    });
  });
});

describe('FallbackAvatarURL', () => {
  test('serializes/deserializes correctly', () => {
    const instance = FallbackAvatarURL.validateAndConstructInstance({
      realm: eg.realm,
      userId: eg.selfUser.user_id,
    });

    const roundTripped = FallbackAvatarURL.deserialize(FallbackAvatarURL.serialize(instance));

    SIZES_WE_USE.forEach(size => {
      expect(instance.get(size).toString()).toEqual(roundTripped.get(size).toString());
    });
  });

  test('gives the `/avatar/{user_id}` URL, on the provided realm', () => {
    const userId = eg.selfUser.user_id;
    const instance = FallbackAvatarURL.validateAndConstructInstance({
      realm: new URL('https://chat.zulip.org'),
      userId,
    });

    expect(instance.get().toString()).toEqual(`https://chat.zulip.org/avatar/${userId.toString()}`);
  });
});
