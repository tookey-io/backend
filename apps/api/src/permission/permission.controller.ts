import { Body, ClassSerializerInterceptor, Controller, Get, Post, UseInterceptors } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuth } from '../decorators/jwt-auth.decorator';
import { PermissionKeyJwtAuth } from '../decorators/permission-key-jwt-auth.decorator';
import { UserContextDto } from '../user/user.dto';
import { PermissionTokenCreateRequestDto, PermissionTokenDto } from './permission.dto';
import { PermissionService } from './permission.service';

@Controller('api/permissions')
@ApiTags('permissions')
@UseInterceptors(ClassSerializerInterceptor)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @JwtAuth()
  @ApiOperation({ description: 'Create Permission Token' })
  @ApiOkResponse({ type: PermissionTokenDto })
  @ApiBadRequestResponse({ description: 'Provided keys not found' })
  @Post()
  async createPermissionToken(
    @CurrentUser() user: UserContextDto,
    @Body() dto: PermissionTokenCreateRequestDto,
  ): Promise<PermissionTokenDto> {
    return await this.permissionService.createPermissionToken(user.id, dto);
  }

  @JwtAuth()
  @ApiOperation({ description: 'Get Permission Tokens by User' })
  @ApiOkResponse({ type: PermissionTokenDto })
  @Get('my')
  async getPermissionTokensByUser(@CurrentUser() user: UserContextDto): Promise<PermissionTokenDto[]> {
    return await this.permissionService.getPermissionTokensByUser(user.id);
  }
}
