const TOKEN_KEY = "graphland:accessToken";

export class TokenService {
  static getToken(): string | null {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem(TOKEN_KEY);
  }

  static setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  static removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  static isAuthenticated() {
    return Boolean(TokenService.getToken());
  }
}
