export enum AppConnectionType {
  OAUTH2 = 'OAUTH2',
  CLOUD_OAUTH2 = 'CLOUD_OAUTH2',
}

export enum OAuth2AuthorizationMethod {
  HEADER = 'HEADER',
  BODY = 'BODY',
}

export interface BaseOAuth2ConnectionValue {
  expires_in?: number;
  token_type: string;
  access_token: string;
  claimed_at: number;
  refresh_token: string;
  scope: string;
  authorization_method?: OAuth2AuthorizationMethod;
  data: Record<string, any>;
}

export interface CloudOAuth2ConnectionValue extends BaseOAuth2ConnectionValue {
  type: AppConnectionType.CLOUD_OAUTH2;
  client_id: string;
  expires_in: number;
  token_type: string;
  access_token: string;
  claimed_at: number;
  refresh_token: string;
  scope: string;
  data: Record<string, any>;
  props?: Record<string, any>;
  token_url: string;
}

export interface OAuth2ConnectionValueWithApp extends BaseOAuth2ConnectionValue {
  type: AppConnectionType.OAUTH2;
  client_id: string;
  client_secret: string;
  token_url: string;
  redirect_url: string;
  props?: Record<string, any>;
}
