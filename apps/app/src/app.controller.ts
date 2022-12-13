import { Response } from 'express';

import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('app')
@ApiTags('App')
export class AppController {
  @Get('token/:token')
  auth(@Param('token') token: string, @Res() res: Response) {
    res.redirect(`tookey://access/${token}`, 302);
  }
}
