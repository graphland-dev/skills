export enum AppExceptionCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  TRY_AGAIN = 'TRY_AGAIN',
  ORG_ALREADY_EXISTS = 'ORG_ALREADY_EXISTS',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

export class AppException extends Error {
  public code: AppExceptionCode;

  constructor(code: AppExceptionCode, message?: string) {
    super(JSON.stringify({ code, message }));
  }
}
