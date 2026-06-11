import { BadRequestException } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import {
  CustomerOtpLoginInput,
  CustomerSendOtpInput,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
  SignUpInput,
} from './dto/auth.input';
import { LoginResponseDto } from './dto/login-response.dto';
import { SignUpResponseDto } from './dto/signup-response.dto';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => LoginResponseDto, { name: 'identity__login' })
  async login(@Args('input') input: LoginInput) {
    try {
      return await this.authService.loginUser(input);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Mutation(() => SignUpResponseDto, { name: 'identity__signup' })
  async signup(@Args('input') input: SignUpInput) {
    try {
      return await this.authService.signupUser(input);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Mutation(() => Boolean, { name: 'identity__forgotPassword' })
  async forgotPassword(@Args('input') input: ForgotPasswordInput) {
    try {
      await this.authService.forgotPassword(input);
      return true;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Mutation(() => Boolean, { name: 'identity__resetPassword' })
  async resetPassword(@Args('input') input: ResetPasswordInput) {
    try {
      await this.authService.resetPassword(input);
      return true;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Mutation(() => Boolean, { name: 'identity__customerSendOtp' })
  async customerSendOtp(@Args('input') input: CustomerSendOtpInput) {
    try {
      await this.authService.customerSendOtp(input);
      return true;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Mutation(() => LoginResponseDto, { name: 'identity__customerOtpLogin' })
  async customerOtpLogin(@Args('input') input: CustomerOtpLoginInput) {
    try {
      return this.authService.customerOtpLogin(input);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
