import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import {
  parseOrigins,
  toCorsOriginOption,
} from '@/config/parse-origins';

export default (): { cors: CorsOptions } => ({
  cors: {
    origin: toCorsOriginOption(
      parseOrigins(
        process.env.CORS_ORIGIN,
        process.env.TRUSTED_ORIGINS,
        process.env.BETTER_AUTH_URL,
      ),
    ),
    credentials: process.env.CORS_CREDENTIALS !== 'false',
  },
});
