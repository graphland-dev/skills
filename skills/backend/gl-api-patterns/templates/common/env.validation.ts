import * as Joi from 'joi';

/**
 * Environment variable validation for ConfigModule.forRoot().
 * The app refuses to boot when a required variable is missing or malformed.
 * @see https://docs.nestjs.com/techniques/configuration#schema-validation
 */
export const envValidationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),

  // Database
  MONGODB_URI: Joi.string()
    .pattern(/^mongodb(\+srv)?:\/\//)
    .required()
    .messages({
      'string.pattern.base':
        'MONGODB_URI must be a valid MongoDB connection string',
    }),

  // Better Auth
  BETTER_AUTH_SECRET: Joi.string().min(32).required(),
  BETTER_AUTH_URL: Joi.string().uri({ allowRelative: false }).required(),
  TRUSTED_ORIGINS: Joi.string().optional(),

  // CORS
  CORS_ORIGIN: Joi.string().optional(),
  CORS_CREDENTIALS: Joi.string().valid('true', 'false').default('true'),

  // Redis (BullMQ, caches — optional until queues are used)
  REDIS_URL: Joi.string()
    .pattern(/^rediss?:\/\//)
    .optional(),
});
