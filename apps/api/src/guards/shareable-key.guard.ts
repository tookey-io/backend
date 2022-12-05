import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ShareableKeyGuard extends AuthGuard('shareable-key') {}
