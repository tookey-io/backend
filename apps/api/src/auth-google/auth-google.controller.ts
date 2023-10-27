import { Body, ClassSerializerInterceptor, Controller, Post, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { AuthGoogleService, GoogleAuthLoginDto } from './auth-google.service';

@Controller('api/auth')
@ApiTags('Authentication')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthGoogleController {
  constructor(
    private readonly googleService: AuthGoogleService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}
  
  @ApiOperation({ description: 'Get access and refresh tokens with discord' })
  @Post('google')
  async googleAuthCallback(@Body() body: GoogleAuthLoginDto) {
    const profile = await this.googleService.getProfileByToken(body);
    const user = await this.userService.getOrCreateGoogleUser(profile);
    const access = this.authService.getJwtAccessToken(user.user);
    const refresh = this.authService.getJwtRefreshToken(user.user);
    await this.userService.setCurrentRefreshToken(refresh.token, user.userId);
    return { access, refresh, user: user.user };
    // return { access, refresh };
  }
}
