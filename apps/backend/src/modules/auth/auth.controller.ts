import {
  Controller, Post, Body, HttpCode, HttpStatus, Req, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { BruteForceGuard } from '../../shared/security/brute-force.guard';

function getIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
    req.ip ??
    'unknown'
  );
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, getIp(req), req.headers['user-agent'] ?? '');
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(BruteForceGuard)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, getIp(req), req.headers['user-agent'] ?? '');
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body('refreshToken') refreshToken: string, @Req() req: Request) {
    return this.authService.refreshTokens(refreshToken, getIp(req), req.headers['user-agent'] ?? '');
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body('refreshToken') refreshToken: string, @Req() req: Request) {
    return this.authService.logout(refreshToken, undefined, getIp(req), req.headers['user-agent'] ?? '');
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    return this.authService.forgotPassword(dto.email, getIp(req), req.headers['user-agent'] ?? '');
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    return this.authService.resetPassword(dto, getIp(req), req.headers['user-agent'] ?? '');
  }
}
