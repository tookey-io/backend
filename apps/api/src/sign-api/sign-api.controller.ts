import { Body, ClassSerializerInterceptor, Controller, HttpCode, Post, UseInterceptors } from '@nestjs/common';
import { JwtAuth } from '../decorators/jwt-auth.decorator';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AllRoles } from '../decorators/all-role.decorator';
import { SignInitializeDto, SignJoinDto } from './sign-api.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserContextDto } from '../user/user.dto';
import { SignApiService } from './sign-api.service';

@ApiTags('API v2')
@Controller('v2/api/sign')
@UseInterceptors(ClassSerializerInterceptor)
@JwtAuth()
export class SignApiController {
  constructor(private readonly signApiService: SignApiService) {}

  @AllRoles('service')
  @ApiOperation({ description: 'Start signing process and request participation of external signer' })
  @ApiOkResponse({ type: Boolean })
  @ApiBody({ type: SignInitializeDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized service' })
  @HttpCode(200)
  @Post('init')
  initiateSigning(@CurrentUser() user: UserContextDto, @Body() body: SignInitializeDto) {
    return this.signApiService.initiateSigning(user, body);
  }

  @AllRoles('service')
  @ApiOperation({ description: 'Start signing process and request participation of external signer' })
  @ApiOkResponse({ type: Boolean })
  @ApiBody({ type: SignJoinDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized service' })
  @HttpCode(200)
  @Post('join')
  joinSigning(@CurrentUser() user: UserContextDto, @Body() body: SignJoinDto) {
    return this.signApiService.joinSigning(user, body);
  }
}
