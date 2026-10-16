import { Args, Mutation, Resolver } from '@nestjs/graphql';
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

@Resolver()
export class PgwBillingResolver {
  constructor(private readonly checkout: PgwCheckoutService) {}

  @Mutation(() => PgwCheckoutSessionResponseDto, {
    name: 'billing__createCheckout',
    description: 'Start hosted PGW checkout for a plan + price variant.',
  })
  @Authenticated()
  createCheckout(
    @Args('input') input: CreatePgwCheckoutInput,
    @TenantName() tenant: string,
    @AuthenticatedUser() user: IAuthUser,
  ): Promise<PgwCheckoutSessionResponseDto> {
    return this.checkout.createCheckout(tenant, input, {
      name: user.name,
      email: user.email,
    });
  }

  @Mutation(() => PgwCheckoutSessionResponseDto, {
    name: 'billing__payInvoice',
    description:
      'Reopen hosted checkout for an existing pending invoice (no new invoice).',
  })
  @Authenticated()
  payInvoice(
    @Args('input') input: PayPgwInvoiceInput,
    @TenantName() tenant: string,
  ): Promise<PgwCheckoutSessionResponseDto> {
    return this.checkout.payInvoice(tenant, input);
  }
}
