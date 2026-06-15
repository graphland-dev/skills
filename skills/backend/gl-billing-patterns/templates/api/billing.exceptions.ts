import { HttpException } from '@nestjs/common';
import { BillingErrorCode } from './billing.contracts';

/** Carries an HTTP status, a machine-readable `code`, and optional extras. */
export class BillingEntitlementException extends HttpException {
  constructor(
    status: number,
    code: BillingErrorCode,
    message: string,
    extra?: Record<string, unknown>,
  ) {
    super({ statusCode: status, message, code, ...extra }, status);
  }
}
