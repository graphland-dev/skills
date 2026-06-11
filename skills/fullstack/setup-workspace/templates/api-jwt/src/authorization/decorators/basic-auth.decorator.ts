import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBasicAuth } from '@nestjs/swagger';

export const BasicAuth = () => {
  return applyDecorators(UseGuards(AuthGuard('basic-auth')), ApiBasicAuth());
};
