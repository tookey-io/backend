import { Body, ClassSerializerInterceptor, Controller, Get, Post, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuth } from '../decorators/jwt-auth.decorator';
import { UserContextDto } from '../user/user.dto';
import { CreateTweetDto } from './twitter.dto';
import { TwitterService } from './twitter.service';

@Controller('api/twitter')
@ApiTags('Twitter')
@UseInterceptors(ClassSerializerInterceptor)
export class TwitterController {
  constructor(private readonly twitterService: TwitterService) {}

  @JwtAuth()
  @Get('me')
  getUser(@CurrentUser() user: UserContextDto) {
    return this.twitterService.getUser({ userId: user.id });
  }

  @JwtAuth()
  @Post('tweet')
  tweet(@CurrentUser() user: UserContextDto, @Body() tweet: CreateTweetDto): Promise<{ id: string; text: string }> {
    return this.twitterService.tweet(user.id, tweet);
  }
}
