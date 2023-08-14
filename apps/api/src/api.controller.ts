import { ClassSerializerInterceptor, Controller, Get, HttpCode, UseInterceptors } from '@nestjs/common';
import { JwtAuth } from './decorators/jwt-auth.decorator';
import { ApiOperation, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { PublicRoute } from './decorators/public-route.decorator';

@ApiTags('API v2')
@Controller('v2/api')
@JwtAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class ApiController {
  @PublicRoute()
  @ApiOperation({ description: 'Healthcheck' })
  @ApiOkResponse({ type: Boolean })
  @HttpCode(200)
  @Get('')
  healthCheck() {
    return true;
  }

  @ApiOperation({ description: 'Healthcheck' })
  @ApiOkResponse({ type: Boolean })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(200)
  @Get('/auth/check')
  checkAuthToken() {
    return true;
  }

  
}
