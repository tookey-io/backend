import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus, Patch,
  Post,
  Query,
  Res,
  UseInterceptors
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AnyRoles } from '../decorators/any-role.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuth } from '../decorators/jwt-auth.decorator';
import { PublicRoute } from '../decorators/public-route.decorator';
import { UserContextDto } from '../user/user.dto';
import { ClaimConnectionDto, CreateOrUpdateSecretDto, Edition, RefreshConnectionDto } from './secrets.dto';
import { SecretsService } from './secrets.service';

@Controller('api/secrets')
@JwtAuth()
@ApiTags('Secrets')
@UseInterceptors(ClassSerializerInterceptor)
export class SecretsController {
  constructor(
    @InjectPinoLogger(SecretsController.name) private readonly logger: PinoLogger,
    private service: SecretsService) {}
  @Get('redirect')
  @HttpCode(HttpStatus.OK)
  @ApiBadRequestResponse({ description: 'Email already exists' })
  async redirect(@Query('code') code: string, @Res() res: Response) {
    if (!code) {
      return res.send('The code is missing in url')
    }

    return res.type('html').type('text/html').send(`<script>if(window.opener){window.opener.postMessage({ 'code': '${encodeURIComponent(code)}' },'*')}</script> <html>Redirect succuesfully, this window should close now</html>`)
  }

  @Get('apps')
  @PublicRoute() 
  @HttpCode(HttpStatus.OK)
  async apps(@CurrentUser() user?: UserContextDto, @Query('edition') edition?: Edition) {
    return this.service.getClientIds(edition, user?.roles.includes('admin'));
  }

  @Post('claim')
  @PublicRoute()
  @HttpCode(HttpStatus.OK)
  @ApiBadRequestResponse({ description: 'Email already exists' })
  async claim(@Body() dto: ClaimConnectionDto) {
    return this.service.claim(dto);
  }

  @Post('refresh')
  @PublicRoute()
  @HttpCode(HttpStatus.OK)
  @ApiBadRequestResponse({ description: 'Email already exists' })
  async refresh(@Body() appConnection: RefreshConnectionDto) {
    return this.service.refresh(appConnection);
  }

  @JwtAuth()
  @AnyRoles('admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBadRequestResponse({ description: 'Secret already exists' })
  async create(@Body() dto: CreateOrUpdateSecretDto) {
    return this.service.create(dto);
  }

  @JwtAuth()
  @AnyRoles('admin')
  @Patch() 
  @HttpCode(HttpStatus.OK)
  @ApiBadRequestResponse({ description: 'Secret already exists' })
  async update(@Body() dto: CreateOrUpdateSecretDto) {
    return this.service.update(dto);
  }

   
}
