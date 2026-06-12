import { isAllowedOrigin } from '@/config/parse-origins';

type AuthRouteMiddleware = (
  req: {
    method?: string;
    headers: Record<string, string | string[] | undefined>;
  },
  res: {
    status: (code: number) => { end: () => void };
    getHeader: (name: string) => unknown;
    setHeader: (name: string, value: string) => void;
  },
  next: () => void,
) => void;

function getHeaderValue(
  header: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(header)) {
    return header.join(', ');
  }

  return header;
}

function appendVaryHeader(res: { getHeader: (name: string) => unknown; setHeader: (name: string, value: string) => void }, value: string): void {
  const currentHeader = res.getHeader('Vary');
  const currentValue =
    typeof currentHeader === 'number'
      ? String(currentHeader)
      : Array.isArray(currentHeader)
        ? currentHeader.join(', ')
        : currentHeader;

  const varyValues = new Set(
    (typeof currentValue === 'string' ? currentValue : '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
  varyValues.add(value);
  res.setHeader('Vary', Array.from(varyValues).join(', '));
}

export function createAuthCorsMiddleware(
  trustedOrigins: string[],
): AuthRouteMiddleware {
  return (req, res, next) => {
    const origin = getHeaderValue(req.headers.origin);

    if (origin && isAllowedOrigin(origin, trustedOrigins)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      appendVaryHeader(res, 'Origin');
    }

    if (req.method?.toUpperCase() === 'OPTIONS') {
      const requestMethod = getHeaderValue(
        req.headers['access-control-request-method'],
      );
      const requestHeaders = getHeaderValue(
        req.headers['access-control-request-headers'],
      );

      res.setHeader(
        'Access-Control-Allow-Methods',
        requestMethod ?? 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS',
      );

      if (requestHeaders) {
        res.setHeader('Access-Control-Allow-Headers', requestHeaders);
        appendVaryHeader(res, 'Access-Control-Request-Headers');
      }

      res.status(204).end();
      return;
    }

    next();
  };
}
