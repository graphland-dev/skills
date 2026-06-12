import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(4001),

  MONGODB_URI: Joi.string()
    .pattern(/^mongodb(\+srv)?:\/\//)
    .required(),

  JWT_SECRET: Joi.string().min(32).required(),

  CORS_ORIGIN: Joi.string().optional(),
  CORS_CREDENTIALS: Joi.string().valid('true', 'false').default('true'),

  REDIS_URL: Joi.string()
    .pattern(/^redis(s)?:\/\//)
    .default('redis://localhost:6379'),

  MAIL_HOST: Joi.string().min(1).optional(),
  MAIL_PORT: Joi.number().port().default(587),
  MAIL_SECURE: Joi.string().valid('true', 'false').default('false'),
  MAIL_USER: Joi.string().optional(),
  MAIL_PASSWORD: Joi.string().optional(),
  MAIL_FROM: Joi.string().optional(),
  MAIL_CONSOLE_URL: Joi.string().uri({ allowRelative: false }).optional(),
}).custom((env, helpers) => {
  const mailHost = env.MAIL_HOST?.trim();
  if (mailHost) {
    if (!env.MAIL_USER?.trim() || !env.MAIL_PASSWORD?.trim() || !env.MAIL_FROM?.trim()) {
      return helpers.error('any.custom', {
        message: 'MAIL_USER, MAIL_PASSWORD, and MAIL_FROM are required when MAIL_HOST is set',
      });
    }
  }
  return env;
});

export const envValidationOptions = {
  allowUnknown: true,
  abortEarly: false,
};
