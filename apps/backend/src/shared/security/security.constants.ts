/** Configuración central de seguridad — ajustar por entorno */
export const SECURITY = {
  // ── Auth lockout ────────────────────────────────────────
  MAX_LOGIN_ATTEMPTS:    5,
  LOCKOUT_TTL_SECONDS:   15 * 60,       // 15 minutos
  ATTEMPT_TTL_SECONDS:   60 * 60,       // ventana de 1 hora

  // ── Rate limiting por endpoint ─────────────────────────
  AUTH_RATE_LIMIT:       10,            // peticiones
  AUTH_RATE_WINDOW_MS:   15 * 60 * 1000, // 15 minutos

  // ── Tokens ──────────────────────────────────────────────
  RESET_TOKEN_TTL:       15 * 60,       // 15 minutos
  REFRESH_TOKEN_TTL:     7 * 24 * 3600, // 7 días

  // ── Contraseñas ─────────────────────────────────────────
  BCRYPT_ROUNDS:         12,
  MIN_PASSWORD_LENGTH:   8,
  PASSWORD_REGEX:        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,

  // ── Sesión ──────────────────────────────────────────────
  ACCESS_TOKEN_TTL:      '15m',

  // ── Redis keys ──────────────────────────────────────────
  REDIS_KEYS: {
    LOGIN_ATTEMPTS: (email: string) => `security:login:attempts:${email}`,
    ACCOUNT_LOCKED: (email: string) => `security:login:locked:${email}`,
    REFRESH_BLACKLIST: (hash: string) => `auth:blacklist:refresh:${hash}`,
    RESET_TOKEN: (hash: string) => `auth:reset:${hash}`,
    RESET_CODE: (code: string) => `auth:reset:code:${code}`,
    AUDIT_LOG: (userId: string) => `security:audit:${userId}`,
  },
} as const;
