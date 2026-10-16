import { Body, Controller, Post } from '@nestjs/common';
import { Authenticated } from '@/authorization/authenticated.decorator';
import { TenantName } from '@/authorization/decorators/tenantID.decorator';
import {
  AuthenticatedUser,
  type IAuthUser,
} from '@/authorization/decorators/user.decorator';
import {
  CreatePgwCheckoutInput,
  PayPgwInvoiceInput,
  PgwCheckoutSessionResponseDto,
} from './pgw-billing.dto';
import { PgwCheckoutService } from './pgw-checkout.service';

/** REST variant of PgwBillingResolver. Register one or the other, not both. */
@Controller('billing')
export class PgwBillingController {
  constructor(private readonly checkout: PgwCheckoutService) {}

  @Post('checkout')
  @Authenticated()
  createCheckout(
    @Body() input: CreatePgwCheckoutInput,
    @TenantName() tenant: string,
    @AuthenticatedUser() user: IAuthUser,
  ): Promise<PgwCheckoutSessionResponseDto> {
    return this.checkout.createCheckout(tenant, input, {
      name: user.name,
      email: user.email,
    });
  }

  @Post('invoices/pay')
  @Authenticated()
  payInvoice(
    @Body() input: PayPgwInvoiceInput,
    @TenantName() tenant: string,
  ): Promise<PgwCheckoutSessionResponseDto> {
    return this.checkout.payInvoice(tenant, input);
  }
}
