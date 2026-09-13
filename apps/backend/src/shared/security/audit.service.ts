import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../infrastructure/cache/redis.service';

export type AuditEvent =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGIN_BLOCKED'
  | 'REGISTER_SUCCESS'
  | 'LOGOUT'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_SUCCESS'
  | 'TOKEN_REFRESHED'
  | 'SUSPICIOUS_REQUEST';

interface AuditEntry {
  event:     AuditEvent;
  email?:    string;
  userId?:   string;
  ip:        string;
  userAgent: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger('SecurityAudit');

  constructor(private readonly redis: RedisService) {}

  async log(entry: AuditEntry): Promise<void> {
    const line = JSON.stringify(entry);

    // Log estructurado en consola
    if (['LOGIN_FAILED', 'LOGIN_BLOCKED', 'SUSPICIOUS_REQUEST'].includes(entry.event)) {
      this.logger.warn(`[SECURITY] ${entry.event} | IP: ${entry.ip} | ${entry.email ?? entry.userId ?? 'unknown'}`);
    } else {
      this.logger.log(`[AUDIT] ${entry.event} | IP: ${entry.ip} | ${entry.email ?? entry.userId ?? 'anonymous'}`);
    }

    // Guardar en Redis con TTL de 30 días para auditoría
    if (entry.userId) {
      const key = `security:audit:${entry.userId}`;
      await this.redis.set(key, line, 30 * 24 * 3600);
    }
  }
}
