import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from './infrastructure/cache/cache.module';
import { SecurityModule } from './shared/security/security.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { GoalsModule } from './modules/goals/goals.module';
import { InflationModule } from './modules/inflation/inflation.module';
import { HealthModule } from './shared/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl:   config.get<number>('THROTTLE_TTL', 900) * 1000,
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbUrl = config.get<string>('DATABASE_URL');
        const dbHost = config.get<string>('DB_HOST', 'localhost');
        const isProd = config.get('NODE_ENV') === 'production';
        const useSsl =
          config.get('DB_SSL') === 'true' ||
          isProd ||
          dbHost.includes('supabase.co') ||
          dbHost.includes('supabase.com') ||
          (dbUrl && (dbUrl.includes('supabase') || dbUrl.includes('sslmode=require')));

        const baseConfig = {
          type: 'postgres' as const,
          entities: [__dirname + '/infrastructure/database/typeorm/entities/*.entity{.ts,.js}'],
          migrations: [__dirname + '/infrastructure/database/migrations/*{.ts,.js}'],
          synchronize: config.get('DB_SYNC') === 'true' || config.get('NODE_ENV') === 'development',
          logging: config.get('DB_LOGGING') === 'true',
          ssl: useSsl ? { rejectUnauthorized: false } : false,
          extra: { max: 10, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 },
        };

        if (dbUrl) {
          return {
            ...baseConfig,
            url: dbUrl,
          };
        }

        return {
          ...baseConfig,
          host: dbHost,
          port: config.get<number>('DB_PORT', 5432),
          username: config.get<string>('DB_USERNAME', 'postgres'),
          password: config.get<string>('DB_PASSWORD', ''),
          database: config.get<string>('DB_NAME', 'postgres'),
        };
      },
    }),

    CacheModule,
    SecurityModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    TransactionsModule,
    BudgetsModule,
    GoalsModule,
    InflationModule,
    HealthModule,
  ],
})
export class AppModule {}
