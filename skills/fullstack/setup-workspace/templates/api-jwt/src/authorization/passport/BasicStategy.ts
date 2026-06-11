import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import { PassportStrategy } from '@nestjs/passport';
import { BasicStrategy } from 'passport-http';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BasicAuthStrategy extends PassportStrategy(
  BasicStrategy,
  'basic-auth',
) {
  private _logger: Logger = new Logger(BasicAuthStrategy.name);
  constructor(private readonly configService: ConfigService) {
    super({
      passReqToCallback: true,
    });
  }

  public validate = (_: any, username: string, password: string): boolean => {
    this._logger.debug(`basic-auth user: ${username}`);
    this._logger.debug(`basic-auth password: ${password}`);

    this._logger.debug(
      `basic-auth config:user: ${this.configService.get<string>(
        'auth.basic.username',
      )}`,
    );
    this._logger.debug(
      `basic-auth config:password: ${this.configService.get<string>(
        'auth.basic.password',
      )}`,
    );

    if (
      this.configService.get<string>('auth.basic.username') === username &&
      this.configService.get<string>('auth.basic.password') === password
    ) {
      return true;
    }
    throw new UnauthorizedException(
      'Invalid username or password. Please try again.',
    );
  };
}
