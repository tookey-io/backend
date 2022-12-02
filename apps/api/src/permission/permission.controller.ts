import { Body, ClassSerializerInterceptor, Controller, Post, UseInterceptors } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuth } from '../decorators/jwt-auth.decorator';
import { Permissions } from '../decorators/permissions.decorator';
import { UserContextDto } from '../user/user.dto';
import { PermissionTokenCreateRequestDto, PermissionTokenDto } from './permission.dto';
import { PermissionService } from './permission.service';

@Controller('api/permissions')
@ApiTags('permissions')
@JwtAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Permissions({ code: 'api:permissions:create-permissions-token', description: 'Create Permissions Token' })
  @ApiOperation({ description: 'Create Permissions Token' })
  @ApiOkResponse({ type: PermissionTokenDto })
  @ApiBadRequestResponse({ description: 'Provided keys not found' })
  @Post()
  async createPermissionToken(
    @CurrentUser() user: UserContextDto,
    @Body() dto: PermissionTokenCreateRequestDto,
  ): Promise<PermissionTokenDto> {
    return await this.permissionService.createPermissionToken(user.id, dto);
  }
}
