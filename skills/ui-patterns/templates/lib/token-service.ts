const TOKEN_KEY = "access_token";

/**
 * Token service for managing authentication tokens
 * Stores tokens in localStorage for persistence across page reloads
 */
export class TokenService {
  /**
   * Set the authentication token
   * @param token - The token to store
   */
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  /**
   * Get the current authentication token
   * @returns The token if it exists, null otherwise
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Remove/clear the authentication token
   */
  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  /**
   * Check if a token exists
   * @returns true if a token exists, false otherwise
   */
  hasToken(): boolean {
    return this.getToken() !== null;
  }
}

// Export a singleton instance
export const tokenService = new TokenService();
