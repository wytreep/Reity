import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * @Global → RedisService disponible en todos los módulos
 * sin necesidad de importar CacheModule en cada uno.
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class CacheModule {}
