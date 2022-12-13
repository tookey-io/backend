import { AuthGuard } from '@nestjs/passport';

export class ShareableKeyJwtGuard extends AuthGuard(['shareable-key', 'jwt']) {}
