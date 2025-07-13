import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  private async generateJwt(data: {
    payload: any;
    jwtSignOptions?: Omit<JwtSignOptions, keyof JwtSignOptions>;
  }) {
    const { payload, jwtSignOptions } = data;
    return await this.jwtService.signAsync(payload, jwtSignOptions ?? {});
  }

  async validateUser(data: { email: string; password: string }) {
    const userData = await this.userService.getUser({ email: data.email });

    if (!userData) {
      throw new BadRequestException('User does not exist, need to register.');
    }

    if (
      !(await this.userService.comparePasswordHash({
        givenPassword: data.password,
        hashedPassword: userData.password,
      }))
    ) {
      throw new UnauthorizedException('Password given is incorrect!');
    }

    return {
      id: userData._id,
      email: userData.email,
    };
  }

  async login(user: { id: string; email: string }) {
    this.logger.log(`In ${this.login.name} function`);

    const jwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return {
      accessToken: await this.generateJwt({
        payload: jwtPayload,
      }),
      refreshToken: await this.generateJwt({
        payload: jwtPayload,
        jwtSignOptions: {
          expiresIn: '7d',
        },
      }),
    };
  }

  async refreshToken(token: string) {
    this.logger.log(`In ${this.refreshToken.name} function`);
    if (!token) throw new UnauthorizedException();

    const payload = this.jwtService.verify(token, {
      secret: this.configService.get('JWT_SECRET') as string,
    });

    return {
      newAccessToken: await this.generateJwt({
        payload: {
          sub: payload.sub,
          email: payload.email,
        },
      }),
    };
  }
}
