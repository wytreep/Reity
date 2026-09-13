import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshStrategy } from './strategies/refresh.strategy';
import { UserOrmEntity } from '../../infrastructure/database/typeorm/entities/user.entity';
import { MailerService } from '../../infrastructure/external/mailer.service';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([UserOrmEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_ACCESS_EXPIRATION', '15m') },
      }),
    }),
  ],
  controllers: [AuthController],
  // RedisService ya está en CacheModule @Global, no necesita importarse
  providers: [AuthService, JwtStrategy, RefreshStrategy, MailerService],
  exports: [AuthService],
})
export class AuthModule {}
