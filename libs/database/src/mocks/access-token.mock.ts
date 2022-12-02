import { AccessToken } from '../entities';
import { metaEntityMock } from './base.mock';
import { userMock } from './user.mock';

export const accessTokenMock: AccessToken = {
  ...metaEntityMock,
  id: 1,
  user: userMock,
  userId: 1,
  token: '8be321958e174d1ff647f2922bca2972ffa3014cba5a06062e0385e8bcd2867f',
  validUntil: new Date(),
};

export const refreshedAccessTokenMock: AccessToken = {
  ...metaEntityMock,
  id: 1,
  user: userMock,
  userId: 1,
  token: '5e0e759b606b00793dbf8147624cb6f6abf5c65ca24a42cc33029dff1ef30159',
  validUntil: new Date(),
};
