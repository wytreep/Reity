import {
  Injectable, CanActivate, ExecutionContext,
  HttpException, HttpStatus,
} from '@nestjs/common';
import { RedisService } from '../../infrastructure/cache/redis.service';
import { AuditService } from './audit.service';
import { SECURITY } from './security.constants';

/**
 * Guard de protección contra fuerza bruta.
 * Bloquea la IP/email tras MAX_LOGIN_ATTEMPTS intentos fallidos.
 * Se aplica en el endpoint de login.
 */
@Injectable()
export class BruteForceGuard implements CanActivate {
  constructor(
    private readonly redis: RedisService,
    private readonly audit: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req   = context.switchToHttp().getRequest();
    const email = req.body?.email?.toLowerCase() ?? '';
    const ip    = this.getClientIp(req);

    if (!email) return true;

    // Verificar si la cuenta está bloqueada
    const lockKey = SECURITY.REDIS_KEYS.ACCOUNT_LOCKED(email);
    const isLocked = await this.redis.exists(lockKey);

    if (isLocked) {
      const ttl = await this.redis.ttl(lockKey);
      await this.audit.log({
        event: 'LOGIN_BLOCKED',
        email, ip,
        userAgent: req.headers['user-agent'] ?? '',
        timestamp: new Date().toISOString(),
        metadata: { remainingSeconds: ttl },
      });

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Cuenta bloqueada temporalmente. Intenta en ${Math.ceil(ttl / 60)} minutos.`,
          retryAfter: ttl,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getClientIp(req: any): string {
    return (
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ??
      req.headers['x-real-ip'] ??
      req.connection?.remoteAddress ??
      'unknown'
    );
  }
}
