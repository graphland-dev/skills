import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(4001),

  MONGODB_URI: Joi.string()
    .pattern(/^mongodb(\+srv)?:\/\//)
    .required()
    .messages({
      'string.pattern.base':
        'MONGODB_URI must be a valid MongoDB connection string',
    }),

  BETTER_AUTH_SECRET: Joi.string().min(32).required(),
  BETTER_AUTH_URL: Joi.string().uri({ allowRelative: false }).required(),
  TRUSTED_ORIGINS: Joi.string().optional(),
  AUTH_DISABLE_CSRF_CHECK: Joi.string().valid('true', 'false').default('true'),

  CORS_ORIGIN: Joi.string().optional(),
  CORS_CREDENTIALS: Joi.string().valid('true', 'false').default('true'),

  GITHUB_CLIENT_ID: Joi.string().optional(),
  GITHUB_CLIENT_SECRET: Joi.string().optional(),
  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),

  MAIL_HOST: Joi.string().min(1).optional(),
  MAIL_PORT: Joi.number().port().default(587),
  MAIL_SECURE: Joi.string().valid('true', 'false').default('false'),
  MAIL_USER: Joi.string().optional(),
  MAIL_PASSWORD: Joi.string().optional(),
  MAIL_FROM: Joi.string().optional(),
  MAIL_CONSOLE_URL: Joi.string().uri({ allowRelative: false }).optional(),
  CONSOLE_URL: Joi.string().uri({ allowRelative: false }).optional(),
  MAIL_SUPPORT_EMAIL: Joi.string().email().optional(),

  REDIS_URL: Joi.string()
    .pattern(/^redis(s)?:\/\//)
    .optional(),
}).custom((env, helpers) => {
  const oauthPairs = [
    ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'GitHub'],
    ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'Google'],
  ] as const;

  for (const [idKey, secretKey, label] of oauthPairs) {
    const hasId = Boolean(env[idKey]?.trim());
    const hasSecret = Boolean(env[secretKey]?.trim());

    if (hasId !== hasSecret) {
      return helpers.error('any.custom', {
        message: `${idKey} and ${secretKey} must both be set or both omitted (${label} OAuth)`,
      });
    }
  }

  const mailHost = env.MAIL_HOST?.trim();
  if (mailHost) {
    if (!env.MAIL_USER?.trim()) {
      return helpers.error('any.custom', {
        message: 'MAIL_USER is required when MAIL_HOST is set',
      });
    }

    if (!env.MAIL_PASSWORD?.trim()) {
      return helpers.error('any.custom', {
        message: 'MAIL_PASSWORD is required when MAIL_HOST is set',
      });
    }

    if (!env.MAIL_FROM?.trim()) {
      return helpers.error('any.custom', {
        message: 'MAIL_FROM is required when MAIL_HOST is set',
      });
    }
  }

  return env;
});

export const envValidationOptions = {
  allowUnknown: true,
  abortEarly: false,
};
