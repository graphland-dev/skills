import { ConfigModule, ConfigService } from '@nestjs/config';
import { PGWBilling } from '@graphland/pgw-merchant/nest';
import * as Joi from 'joi';

/**
 * Spread into `envValidationSchema` (Joi.object({ ...pgwEnvSchema, ... })).
 * The gateway silently no-ops without keys, so production must refuse to boot.
 */
export const pgwEnvSchema = {
  PGW_API_KEY: Joi.string().required(),
  PGW_CLIENT_ID: Joi.string().required(),
  PGW_BASE_URL: Joi.string().uri().default('https://pgw.graphland.dev'),
  WEB_CONSOLE_URL: Joi.string().uri({ allowRelative: false }).required(),
};

/**
 * Global module: provides PAYMENT_GATEWAY, EntitlementService, and
 * PGW_BILLING_CONFIG to every module. Import once in AppModule, before
 * feature modules.
 */
export const PgwBillingModule = PGWBilling.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    apiKey: config.getOrThrow<string>('PGW_API_KEY'),
    clientId: config.getOrThrow<string>('PGW_CLIENT_ID'),
    baseUrl: config.get<string>('PGW_BASE_URL'),
    consoleUrl: config.getOrThrow<string>('WEB_CONSOLE_URL'),
    checkoutReturnPath: '/merchant/{tenant}/billing?checkout={outcome}',
    defaultPlanKey: 'free',
    defaultPriceVariantKey: '30d',
  }),
});
