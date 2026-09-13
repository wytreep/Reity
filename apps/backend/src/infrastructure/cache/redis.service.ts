import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.config.get('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      password: this.config.get('REDIS_PASSWORD') || undefined,
      retryStrategy: (times) => {
        // Reintentar con backoff exponencial, máx 30s
        const delay = Math.min(times * 500, 30_000);
        this.logger.warn(`Redis reconectando... intento ${times}, delay ${delay}ms`);
        return delay;
      },
    });

    this.client.on('connect', () => this.logger.log('✅ Redis conectado'));
    this.client.on('error', (err) => this.logger.error('Redis error:', err.message));
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  /** Guardar valor con TTL en segundos */
  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value, 'EX', ttlSeconds);
  }

  /** Obtener valor */
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  /** Eliminar clave */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /** Verificar existencia */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /** TTL restante en segundos (-1 = sin expiración, -2 = no existe) */
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }
}
