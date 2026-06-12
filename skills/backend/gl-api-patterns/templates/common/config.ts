/**
 * Modular config pattern: one small factory per concern, aggregated into
 * ConfigModule.forRoot({ load: [...] }) and read via configService.get('app.port').
 * In a real project each factory lives in its own file (config__app.config.ts,
 * config__database.config.ts, ...) aggregated by config/index.ts.
 */

export const appConfig = () => ({
  app: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    nodeEnv: process.env.NODE_ENV ?? 'development',
  },
});

export const databaseConfig = () => ({
  database: {
    mongodbUri: process.env.MONGODB_URI,
  },
});

export const corsConfig = () => ({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) ?? true,
    credentials: process.env.CORS_CREDENTIALS !== 'false',
  },
});

export const configLoaders = [appConfig, databaseConfig, corsConfig];
