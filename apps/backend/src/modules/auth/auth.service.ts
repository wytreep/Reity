import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
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
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

// Prefijos de claves Redis
const REFRESH_BLACKLIST = 'auth:blacklist:refresh:';
const RESET_TOKEN       = 'auth:reset:';

// TTLs en segundos
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 días
const RESET_TTL_SECONDS   = 15 * 60;           // 15 minutos

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
  ) {}

  // ─────────────────────────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('El email ya está registrado');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      currency: 'COP',
    });
    await this.userRepo.save(user);
    this.logger.log(`Nuevo usuario registrado: ${user.email}`);

    const tokens = await this.generateTokens(user.id, user.email);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  // ─────────────────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });

    // Comparación constante aunque el usuario no exista → evita timing attacks
    const dummyHash = '$2b$12$invalidhashforcomparison000000000000000000000';
    const valid = user
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : await bcrypt.compare(dto.password, dummyHash);

    if (!user || !valid) throw new UnauthorizedException('Credenciales inválidas');

    const tokens = await this.generateTokens(user.id, user.email);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  // ─────────────────────────────────────────────────────────
  // REFRESH TOKENS
  // ─────────────────────────────────────────────────────────
  async refreshTokens(refreshToken: string) {
    // 1. Verificar firma y expiración
    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    // 2. Verificar que no esté en blacklist
    const isBlacklisted = await this.redis.exists(
      `${REFRESH_BLACKLIST}${this.hashToken(refreshToken)}`,
    );
    if (isBlacklisted) throw new UnauthorizedException('Refresh token revocado');

    // 3. Verificar que el usuario sigue existiendo
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    // 4. Rotar tokens: invalidar el actual y emitir nuevos
    await this.blacklistRefreshToken(refreshToken);
    return this.generateTokens(user.id, user.email);
  }

  // ─────────────────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────────────────
  async logout(refreshToken: string) {
    if (refreshToken) {
      await this.blacklistRefreshToken(refreshToken);
    }
    return { message: 'Sesión cerrada correctamente' };
  }

  // ─────────────────────────────────────────────────────────
  // FORGOT PASSWORD
  // ─────────────────────────────────────────────────────────
  async forgotPassword(email: string) {
    // Respuesta genérica siempre → no revela si el email existe
    const user = await this.userRepo.findOne({ where: { email } });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      // Guardar hash en Redis con TTL 15 min
      await this.redis.set(
        `${RESET_TOKEN}${hashedToken}`,
        user.id,
        RESET_TTL_SECONDS,
      );

      const appUrl = this.config.get('APP_URL', 'reity://');
      const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

      try {
        await this.mailer.send({
          to: user.email,
          subject: 'Recupera tu contraseña — Reity',
          html: this.mailer.resetPasswordTemplate(user.fullName, resetUrl),
        });
      } catch (err) {
        this.logger.error('Error enviando email de recuperación:', err.message);
        // No lanzar error al cliente → el usuario no sabe si el email existe
      }
    }

    return { message: 'Si el email está registrado, recibirás instrucciones' };
  }

  // ─────────────────────────────────────────────────────────
  // RESET PASSWORD
  // ─────────────────────────────────────────────────────────
  async resetPassword(dto: ResetPasswordDto) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(dto.token)
      .digest('hex');

    const userId = await this.redis.get(`${RESET_TOKEN}${hashedToken}`);
    if (!userId) throw new BadRequestException('Token inválido o expirado');

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepo.save(user);

    // Invalidar el token de reset inmediatamente
    await this.redis.del(`${RESET_TOKEN}${hashedToken}`);

    this.logger.log(`Contraseña restablecida para: ${user.email}`);
    return { message: 'Contraseña actualizada correctamente' };
  }

  // ─────────────────────────────────────────────────────────
  // HELPERS PRIVADOS
  // ─────────────────────────────────────────────────────────

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRATION', '7d'),
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private async blacklistRefreshToken(token: string): Promise<void> {
    const hash = this.hashToken(token);
    await this.redis.set(
      `${REFRESH_BLACKLIST}${hash}`,
      '1',
      REFRESH_TTL_SECONDS,
    );
  }

  /** Hash SHA-256 del token para no almacenar el token en crudo en Redis */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  sanitizeUser(user: UserOrmEntity) {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
