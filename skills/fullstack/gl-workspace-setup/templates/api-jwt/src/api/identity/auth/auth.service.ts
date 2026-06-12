import { MatchOperator } from '@/common/dto/CommonFindDocumentDto';
import { MailService } from '@/common/mail/mail.service';
import { RedisService } from '@/common/redis/redis.service';

import {
  AppException,
  AppExceptionCode,
} from '@/common/exceptions/app-exception';
import { getRandomInts } from '@/common/utils/random-code';
import variableInjector from '@/common/utils/variable-injector';
import { ForbiddenException, Injectable } from '@nestjs/common';
import axios from 'axios';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { TenantService } from '../tenant/tenant.service';
import { User } from '@/entities/identity/user.entity';
import { UserDomain } from '@/entities/identity/user-domain.enum';
import { UserService } from '../user/user.service';
import {
  CustomerOtpLoginInput,
  CustomerSendOtpInput,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
  SignUpInput,
} from './dto/auth.input';
import { processPhoneNumber } from '@/common/utils/process-phone-number';
import { ForgotPasswordMailable } from '@/common/mail/mailables/forgot-password.mailable';

@Injectable()
export class AuthService {
  constructor(
    public readonly userService: UserService,
    public readonly tenantService: TenantService,
    public readonly redisService: RedisService,
    public readonly mailService: MailService,
  ) {}

  async loginUser(input: LoginInput) {
    //1. check user exists
    const user = await this.userService.findOne({
      key: 'email',
      operator: MatchOperator.eq,
      value: input.email,
    });

    if (!user) throw new ForbiddenException('Invalid email or password!');

    // 2. Password check
    const matched = bcrypt.compareSync(input.password, user.password);
    if (!matched) throw new ForbiddenException('Invalid email or password!');

    // 3. create token -
    return {
      accessToken: this.createToken(user),
      systemRoles: user.systemRoles || [],
      memberships: user.memberships || [],
    };
  }

  async signupUser(input: SignUpInput) {
    //1. check user exists
    const user = await this.userService.findOne({
      key: 'email',
      operator: MatchOperator.eq,
      value: input.email,
    });

    if (user)
      throw new AppException(
        AppExceptionCode.ALREADY_EXISTS,
        'User is already exist!',
      );

    // 2. check tenant exists
    const tenant = await this.tenantService.findOne({
      key: 'uid',
      operator: MatchOperator.eq,
      value: input.tenantUid,
    });
    if (tenant)
      throw new AppException(
        AppExceptionCode.ORG_ALREADY_EXISTS,
        'Organization is already exist!',
      );

    const payload = {
      name: input?.name,
      email: input?.email,
      password: input?.password,
    };

    // if (input?.password) {
    //   payload['password'] = bcrypt.hashSync(input.password);
    // }

    const createdTenant = await this.tenantService.createOne({
      uid: input?.tenantUid,
      name: input?.tenantName,
      address: input?.tenantAddress,
      businessPhoneNumber: input?.tenantBusinessPhoneNumber,
    });

    const createdUser = await this.userService.createOne({
      ...payload,
      memberships: [
        {
          tenant: createdTenant.uid,
          roles: ['system:admin'],
          userDomain: UserDomain.MERCHANT || undefined,
        },
      ],
    });

    return {
      tenantStatus: createdTenant.status,
      createdTenantId: createdTenant._id,
      createdUserId: createdUser._id,
    };
  }

  createToken(user: User) {
    return jwt.sign(
      {
        email: user.email,
        sub: user._id,
        name: user.name,
      },
      process.env.JWT_SECRET,
      {
        algorithm: 'HS256',
        issuer: process.env.JWT_ISSUER ?? 'api.local',
        audience: process.env.JWT_AUDIENCE ?? 'app.local',
      },
    );
  }

  /**
   * Forgot password
   * @param input - ForgotPasswordInput
   */
  async forgotPassword(input: ForgotPasswordInput) {
    // Procedures: forgot password
    // 1. check user exists
    // 2. create token
    // 3. send email
    // ---------------------------

    // 1. check user exists
    const user = await this.userService.findOne({
      key: 'email',
      operator: MatchOperator.eq,
      value: input.email,
    });
    if (!user) throw new ForbiddenException('User is not exist!');

    const token = crypto.randomUUID();

    // 2. create token
    this.redisService.setValue(
      `forgot-password:${input.email}`,
      token,
      60 * 1000 * 5,
    );

    // Ensure email and token are not empty
    if (!input.email || !token) {
      throw new ForbiddenException('Email or token is missing');
    }

    // URL encode the email and token for use in query parameters
    const encodedEmail = encodeURIComponent(input.email);
    const encodedToken = encodeURIComponent(token);

    // Build URL with proper variable injection
    // Support multiple formats: {{email}}, #email#, %email%
    let url = input.clientUrlTemplate;

    // Replace variables - try all supported formats
    url = url.replace(/\{\{\s*email\s*\}\}/g, encodedEmail);
    url = url.replace(/\{\{\s*token\s*\}\}/g, encodedToken);
    url = url.replace(/#\s*email\s*#/g, encodedEmail);
    url = url.replace(/#\s*token\s*#/g, encodedToken);
    url = url.replace(/%\s*email\s*%/g, encodedEmail);
    url = url.replace(/%\s*token\s*%/g, encodedToken);

    // Also use variableInjector as fallback
    url = variableInjector(
      {
        email: 'encodedEmail',
        token: 'encodedToken',
      },
      url,
    );

    console.log({
      url,
      email: input.email,
      encodedEmail,
      token,
      encodedToken,
      clientUrlTemplate: input.clientUrlTemplate,
    });

    // 3. send email
    const forgotPasswordEmailResponse = await this.mailService.sendEmail({
      subject: 'Reset your password',
      mailable: new ForgotPasswordMailable({
        url,
        userName: user.name,
      }),
      recipients: [
        {
          name: user.name,
          email: user.email,
        },
      ],
    });

    console.log('forgotPasswordEmailResponse', forgotPasswordEmailResponse);
  }

  /**
   * Reset password
   * @param input - ResetPasswordInput
   */
  async resetPassword(input: ResetPasswordInput) {
    // Procedures: reset password
    // 1. check user exists
    // 2. check token exists
    // 3. check token is valid
    // 4. update password
    // 5. send email
    // ---------------------------

    // 1. check user exists
    const user = await this.userService.findOne({
      key: 'email',
      operator: MatchOperator.eq,
      value: input.email,
    });
    if (!user)
      throw new AppException(
        AppExceptionCode.ALREADY_EXISTS,
        'User is not exist!',
      );

    // 2. check token exists
    const token = await this.redisService.getValue(
      `forgot-password:${input.email}`,
    );

    if (!token)
      throw new ForbiddenException(
        'Password reset token is invalid or expired!. Please try again.',
      );

    // 3. check token is valid
    if (token !== input.token) throw new ForbiddenException('Invalid token!');

    // 4. Delete token
    await this.redisService.forget(`forgot-password:${input.email}`);

    // 4. update password
    const hashedPassword = bcrypt.hashSync(input.password);
    await this.userService.userModel.findOneAndUpdate(
      {
        email: input.email,
      },
      {
        $set: {
          password: hashedPassword,
        },
      },
    );
  }

  async customerSendOtp(input: CustomerSendOtpInput) {
    const bangladeshPhonePattern = /^(?:\+880|880|0)1[3-9]\d{8}$/;

    if (!bangladeshPhonePattern.test(input.phoneNumber))
      throw new AppException(
        AppExceptionCode.FORBIDDEN,
        'Only Bangladeshi phone number is allowed!',
      );
    const _phoneNumber = input.phoneNumber.startsWith('+88')
      ? input.phoneNumber
      : `+88${input.phoneNumber}`;

    const _otpExists = await this.redisService.getValue(
      'login-otp:' + _phoneNumber,
    );

    if (_otpExists)
      throw new AppException(
        AppExceptionCode.TRY_AGAIN,
        'Try again after 120 seconds',
      );

    const otpCode = getRandomInts(6);
    let _user = await this.userService.userModel.findOne({
      phoneNumber: _phoneNumber,
    });

    // If user is not exists, create new user
    if (!_user) {
      _user = await this.userService.createOne({
        name: 'Unknown',
        phoneNumber: _phoneNumber,
        memberships: [
          {
            tenant: input.tenant,
            roles: ['customer:general'],
            userDomain: UserDomain.CUSTOMER,
          },
        ],
      });
    }

    // check if the input.tenant is exists in _user.memberships, if not, add it
    if (!_user.memberships.find((m) => m.tenant === input.tenant)) {
      await this.userService.userModel.updateOne(
        { _id: _user._id },
        {
          $push: {
            memberships: {
              tenant: input.tenant,
              roles: ['customer:general'],
              userDomain: UserDomain.CUSTOMER,
            },
          },
        },
      );
    }

    await this.redisService.setValue(
      'login-otp:' + _phoneNumber,
      otpCode,
      120 * 1000,
    );

    console.log('otpCode', otpCode);
    await axios.get('http://api.greenweb.com.bd/g_api.php', {
      params: {
        json: 1,
        to: _phoneNumber,
        message: `\nআপনার OTP কোড ${otpCode}\nYour OTP code is ${otpCode}`,
        token: '110440851401715914300be5a61a4674964de3238e502bb8545d7',
      },
    });
  }

  async customerOtpLogin(input: CustomerOtpLoginInput) {
    const _phoneNumber = processPhoneNumber(input.phoneNumber);

    const _otpExists = await this.redisService.getValue(
      'login-otp:' + _phoneNumber,
    );
    console.log({ _otpExists });

    if (!_otpExists)
      throw new AppException(AppExceptionCode.FORBIDDEN, 'Invalid OTP codedd!');

    const _user = await this.userService.userModel.findOne({
      phoneNumber: _phoneNumber,
    });

    if (!_user)
      throw new AppException(
        AppExceptionCode.FORBIDDEN,
        'Invalid phone number or user is not exist!',
      );

    if (_otpExists != input.otpCode)
      throw new AppException(AppExceptionCode.FORBIDDEN, 'Invalid OTP code!');

    await this.redisService.forget(`login-otp:${_phoneNumber}`);

    // update user
    await this.userService.userModel.findOneAndUpdate(
      { phoneNumber: _phoneNumber },
      {
        $set: { lastLoginAt: new Date() },
      },
    );

    return {
      accessToken: this.createToken(_user),
      systemRoles: _user.systemRoles || [],
      memberships: _user.memberships || [],
    };
  }
}
