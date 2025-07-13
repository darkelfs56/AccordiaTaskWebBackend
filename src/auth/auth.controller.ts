import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { UserFromReq } from 'src/user/dto/user.dto';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.login(
      req.user as UserFromReq,
    );

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      signed: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, //15m
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      signed: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, //7d
    });

    return {
      message: 'Login successful',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: true,
      signed: true,
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      signed: true,
    });
    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.signedCookies['refresh_token'] as string;
    console.log(`refreshToken here is: ${token}`);
    const { newAccessToken } = await this.authService.refreshToken(token);

    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      signed: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, //15m
    });

    return { message: 'Token successfully refreshed' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('user')
  async getUserData(@Req() req: Request) {
    return {
      email: (req.user as UserFromReq).email,
    };
  }
}
