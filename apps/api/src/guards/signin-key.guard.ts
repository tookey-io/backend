import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class SigninKeyGuard extends AuthGuard('signin-key') {}
