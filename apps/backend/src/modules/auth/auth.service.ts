import {
  Injectable, UnauthorizedException, ConflictException,
  NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserOrmEntity } from '../../infrastructure/database/typeorm/entities/user.entity';
import { RedisService } from '../../infrastructure/cache/redis.service';
import { MailerService } from '../../infrastructure/external/mailer.service';
import { AuditService } from '../../shared/security/audit.service';
import { SECURITY } from '../../shared/security/security.constants';
import { enforcePasswordPolicy } from '../../shared/security/password.validator';
import { validateRealEmail } from '../../shared/security/email.validator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userRepo: Repository<UserOrmEntity>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly mailer: MailerService,
    private readonly audit: AuditService,
  ) {}

  async register(dto: RegisterDto, ip = 'unknown', ua = '') {
    // 1. Validar complejidad de contraseña
    enforcePasswordPolicy(dto.password);

    // 2. Validar que el dominio del correo sea real y activo (MX check)
    await validateRealEmail(dto.email);

    // 3. Comprobar si ya existe
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('El email ya está registrado');

    // 4. Crear usuario con hash seguro
    const passwordHash = await bcrypt.hash(dto.password, SECURITY.BCRYPT_ROUNDS);
    const user = this.userRepo.create({ email: dto.email, passwordHash, fullName: dto.fullName, currency: 'COP' });
    await this.userRepo.save(user);

    // 5. Enviar correo de bienvenida con políticas de privacidad
    try {
      const nowFormatted = new Date().toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        dateStyle: 'long',
        timeStyle: 'short',
      });
      await this.mailer.send({
        to: user.email,
        subject: '¡Bienvenido a Reity! Confirmación de cuenta y políticas de privacidad',
        html: this.mailer.welcomeEmailTemplate(user.fullName, user.email, nowFormatted),
      });
    } catch (err: any) {
      this.logger.warn(`No se pudo enviar el correo de bienvenida a ${user.email}: ${err?.message || err}`);
    }

    await this.audit.log({ event: 'REGISTER_SUCCESS', email: user.email, userId: user.id, ip, userAgent: ua, timestamp: new Date().toISOString() });
    return { user: this.sanitizeUser(user), ...(await this.generateTokens(user.id, user.email)) };
  }

  async login(dto: LoginDto, ip = 'unknown', ua = '') {
    const attemptsKey = SECURITY.REDIS_KEYS.LOGIN_ATTEMPTS(dto.email);
    const lockKey     = SECURITY.REDIS_KEYS.ACCOUNT_LOCKED(dto.email);

    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    const dummyHash = '$2b$12$invalidhashforcomparison000000000000000000000';
    const valid = user ? await bcrypt.compare(dto.password, user.passwordHash) : (await bcrypt.compare(dto.password, dummyHash), false);

    if (!user || !valid) {
      const attempts = await this.incrementWithTTL(attemptsKey, SECURITY.ATTEMPT_TTL_SECONDS);
      await this.audit.log({ event: 'LOGIN_FAILED', email: dto.email, ip, userAgent: ua, timestamp: new Date().toISOString(), metadata: { attempts } });

      if (attempts >= SECURITY.MAX_LOGIN_ATTEMPTS) {
        await this.redis.set(lockKey, '1', SECURITY.LOCKOUT_TTL_SECONDS);
        await this.redis.del(attemptsKey);
        throw new UnauthorizedException(`Cuenta bloqueada por ${SECURITY.LOCKOUT_TTL_SECONDS / 60} minutos`);
      }

      const remaining = SECURITY.MAX_LOGIN_ATTEMPTS - attempts;
      throw new UnauthorizedException(`Credenciales invalidas. ${remaining} intento${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}`);
    }

    await this.redis.del(attemptsKey);
    await this.audit.log({ event: 'LOGIN_SUCCESS', email: user.email, userId: user.id, ip, userAgent: ua, timestamp: new Date().toISOString() });
    return { user: this.sanitizeUser(user), ...(await this.generateTokens(user.id, user.email)) };
  }

  async refreshTokens(refreshToken: string, ip = 'unknown', ua = '') {
    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verify(refreshToken, { secret: this.config.get('JWT_REFRESH_SECRET') });
    } catch {
      throw new UnauthorizedException('Refresh token invalido o expirado');
    }

    const hash = this.hashToken(refreshToken);
    if (await this.redis.exists(SECURITY.REDIS_KEYS.REFRESH_BLACKLIST(hash))) {
      throw new UnauthorizedException('Token revocado');
    }

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    await this.blacklistRefreshToken(refreshToken);
    await this.audit.log({ event: 'TOKEN_REFRESHED', userId: user.id, ip, userAgent: ua, timestamp: new Date().toISOString() });
    return this.generateTokens(user.id, user.email);
  }

  async logout(refreshToken: string, userId?: string, ip = 'unknown', ua = '') {
    if (refreshToken) await this.blacklistRefreshToken(refreshToken);
    await this.audit.log({ event: 'LOGOUT', userId, ip, userAgent: ua, timestamp: new Date().toISOString() });
    return { message: 'Sesion cerrada correctamente' };
  }

  async forgotPassword(email: string, ip = 'unknown', ua = '') {
    const user = await this.userRepo.findOne({ where: { email } });

    if (user) {
      const limitKey = `auth:reset:limit:${email}`;
      const requests = await this.incrementWithTTL(limitKey, 3600);
      if (requests <= 3) {
        const resetToken  = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const code        = Math.floor(100000 + crypto.randomInt(900000)).toString();

        await Promise.all([
          this.redis.set(SECURITY.REDIS_KEYS.RESET_TOKEN(hashedToken), user.id, SECURITY.RESET_TOKEN_TTL),
          this.redis.set(SECURITY.REDIS_KEYS.RESET_CODE(code), user.id, SECURITY.RESET_TOKEN_TTL),
        ]);

        const appUrl   = this.config.get('APP_URL', 'reity://');
        const resetUrl = `${appUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

        try {
          await this.mailer.send({
            to: user.email,
            subject: 'Recupera tu contraseña - Reity',
            html: this.mailer.resetPasswordTemplate(user.fullName, resetUrl, code),
            code,
            resetUrl,
          });
        } catch (err: any) {
          this.logger.error('Error enviando email:', err?.message || err);
        }

        await this.audit.log({
          event: 'PASSWORD_RESET_REQUEST',
          email: user.email,
          userId: user.id,
          ip,
          userAgent: ua,
          timestamp: new Date().toISOString(),
          metadata: { codeGenerated: true },
        });
      }
    }

    return { message: 'Si el email está registrado, recibirás las instrucciones en breve' };
  }

  async resetPassword(dto: ResetPasswordDto, ip = 'unknown', ua = '') {
    enforcePasswordPolicy(dto.newPassword);
    const tokenInput = dto.token.trim();
    let userId: string | null = null;
    let tokenKeyToDelete: string | null = null;
    let codeKeyToDelete: string | null = null;

    if (/^\d{6}$/.test(tokenInput)) {
      codeKeyToDelete = SECURITY.REDIS_KEYS.RESET_CODE(tokenInput);
      userId = await this.redis.get(codeKeyToDelete);
    } else {
      const hashedToken = crypto.createHash('sha256').update(tokenInput).digest('hex');
      tokenKeyToDelete = SECURITY.REDIS_KEYS.RESET_TOKEN(hashedToken);
      userId = await this.redis.get(tokenKeyToDelete);
    }

    if (!userId) {
      throw new BadRequestException('El código o enlace de recuperación es inválido o ha expirado');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, SECURITY.BCRYPT_ROUNDS);
    await this.userRepo.save(user);

    if (tokenKeyToDelete) await this.redis.del(tokenKeyToDelete);
    if (codeKeyToDelete)  await this.redis.del(codeKeyToDelete);

    await this.audit.log({
      event: 'PASSWORD_RESET_SUCCESS',
      email: user.email,
      userId: user.id,
      ip,
      userAgent: ua,
      timestamp: new Date().toISOString(),
    });

    return { message: 'Contraseña actualizada correctamente' };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: SECURITY.ACCESS_TOKEN_TTL }),
      this.jwtService.signAsync(payload, { secret: this.config.get('JWT_REFRESH_SECRET'), expiresIn: this.config.get('JWT_REFRESH_EXPIRATION', '7d') }),
    ]);
    return { accessToken, refreshToken };
  }

  private async blacklistRefreshToken(token: string): Promise<void> {
    await this.redis.set(SECURITY.REDIS_KEYS.REFRESH_BLACKLIST(this.hashToken(token)), '1', SECURITY.REFRESH_TOKEN_TTL);
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async incrementWithTTL(key: string, ttl: number): Promise<number> {
    const current = await this.redis.get(key);
    const count   = parseInt(current ?? '0', 10) + 1;
    await this.redis.set(key, String(count), ttl);
    return count;
  }

  sanitizeUser(user: UserOrmEntity) {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
