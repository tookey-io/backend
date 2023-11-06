import { omit } from 'lodash';

type UnformattedOauthResponse = Record<string, any> & {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
};

export function formatOAuth2Response(response: UnformattedOauthResponse) {
  const secondsSinceEpoch = Math.round(Date.now() / 1000);
  return {
    access_token: response.access_token,
    expires_in: response.expires_in,
    claimed_at: secondsSinceEpoch,
    refresh_token: response.refresh_token,
    scope: response.scope,
    token_type: response.token_type,
    data: omit(response, ['access_token', 'expires_in', 'refresh_token', 'scope', 'token_type']),
  };
}
