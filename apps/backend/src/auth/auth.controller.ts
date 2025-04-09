import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Request,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() loginDto: Record<string, any>,
    @Res({ passthrough: true }) response: Response,
  ) {
    const res = await this.authService.login(
      loginDto.username,
      loginDto.password,
    );
    const validTime = 365 * 24 * 60 * 60 * 1000;
    response.cookie('access_token', res.accessToken, {
      expires: new Date(new Date().getTime() + validTime),
      // httpOnly: true,
    });

    return res;
  }

  @Public()
  @Post('register')
  async register(
    @Body() registerDto: Record<string, any>,
    @Res({ passthrough: true }) response: Response,
  ) {
    const res = await this.authService.register(
      registerDto.username,
      registerDto.password,
    );

    const validTime = 365 * 24 * 60 * 60 * 1000;
    response.cookie('access_token', res.accessToken, {
      expires: new Date(new Date().getTime() + validTime),
      // httpOnly: true,
    });

    return res;
  }

  // @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
