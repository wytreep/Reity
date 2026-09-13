import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RedisService } from '../../infrastructure/cache/redis.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async check() {
    const [dbOk, redisOk] = await Promise.allSettled([
      this.dataSource.query('SELECT 1'),
      this.redis.get('health:ping'),
    ]);

    const services = {
      database: dbOk.status === 'fulfilled' ? 'up' : 'down',
      redis:    redisOk.status === 'fulfilled' ? 'up' : 'down',
    };

    return {
      status: Object.values(services).every((s) => s === 'up') ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services,
    };
  }
}
