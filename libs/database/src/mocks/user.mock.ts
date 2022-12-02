import { User } from '../entities';
import { metaEntityMock } from './base.mock';

export const userMock: User = {
  ...metaEntityMock,
  fresh: true,
  lastInteraction: new Date(),
  children: [],
  parent: null,
  keyLimit: 2,
  keys: [],
  refreshToken: '$2b$10$xYB5X2xR8h.eAeuVNYzPA.Exn6EOth6zQSg4zm5jIhUvFLjHX4FT2',
};
