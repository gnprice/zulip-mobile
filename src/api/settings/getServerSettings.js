/* @flow strict-local */
import type { ApiResponseSuccess } from '../transportTypes';

// This corresponds to AUTHENTICATION_FLAGS in zulip/zulip:zerver/models.py .
export type AuthenticationMethods = {|
  dev: boolean,
  github: boolean,
  google: boolean,
  ldap: boolean,
  password: boolean,
  azuread: boolean,
  remoteuser: boolean,
|};

export type ApiResponseServerSettings = {|
  ...ApiResponseSuccess,
  authentication_methods: AuthenticationMethods,
  email_auth_enabled: boolean,
  push_notifications_enabled: boolean,
  realm_description: string,
  realm_icon: string,
  realm_name: string,
  realm_uri: string,
  require_email_format_usernames: boolean,
  zulip_version: string,
|};
