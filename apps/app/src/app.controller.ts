import { Response } from 'express';

import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('app')
@ApiTags('app')
export class AppController {
  @Get('open')
  auth(@Query('token') token: string, @Res() res: Response) {
    res.redirect(`tookey://access/${token}`);
  }
}
