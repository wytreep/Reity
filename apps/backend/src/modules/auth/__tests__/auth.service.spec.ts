import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { UserOrmEntity } from '../../../infrastructure/database/typeorm/entities/user.entity';
import { RedisService } from '../../../infrastructure/cache/redis.service';
import { MailerService } from '../../../infrastructure/external/mailer.service';
import * as bcrypt from 'bcrypt';

// ─── Mocks ──────────────────────────────────────────────
const mockUserRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('mock-token'),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string, def?: any) => {
    const config: Record<string, any> = {
      JWT_SECRET: 'test-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_ACCESS_EXPIRATION: '15m',
      JWT_REFRESH_EXPIRATION: '7d',
    };
    return config[key] ?? def;
  }),
};

const mockRedisService = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  exists: jest.fn().mockResolvedValue(false),
};

const mockMailerService = {
  send: jest.fn(),
  resetPasswordTemplate: jest.fn().mockReturnValue('<html/>'),
};

// ─── Suite ──────────────────────────────────────────────
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(UserOrmEntity), useValue: mockUserRepo },
        { provide: JwtService,    useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisService,  useValue: mockRedisService },
        { provide: MailerService, useValue: mockMailerService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ── register ──────────────────────────────────────────
  describe('register', () => {
    it('crea un nuevo usuario exitosamente', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      const fakeUser = {
        id: 'uuid-1',
        email: 'test@reity.co',
        fullName: 'Test User',
        currency: 'COP',
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUserRepo.create.mockReturnValue(fakeUser);
      mockUserRepo.save.mockResolvedValue(fakeUser);

      const result = await service.register({
        email: 'test@reity.co',
        password: 'Password123!',
        fullName: 'Test User',
      });

      expect(result.user.email).toBe('test@reity.co');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.accessToken).toBe('mock-token');
    });

    it('lanza ConflictException si el email ya existe', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({
          email: 'existing@reity.co',
          password: 'Password123!',
          fullName: 'Existing',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── login ─────────────────────────────────────────────
  describe('login', () => {
    it('autentica con credenciales correctas', async () => {
      const hash = await bcrypt.hash('Password123!', 12);
      mockUserRepo.findOne.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@reity.co',
        passwordHash: hash,
        fullName: 'Test',
        currency: 'COP',
      });

      const result = await service.login({
        email: 'test@reity.co',
        password: 'Password123!',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('lanza UnauthorizedException con credenciales incorrectas', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'no@reity.co', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── logout ────────────────────────────────────────────
  describe('logout', () => {
    it('agrega el token a la blacklist de Redis', async () => {
      await service.logout('valid-refresh-token');
      expect(mockRedisService.set).toHaveBeenCalledWith(
        expect.stringContaining('auth:blacklist:refresh:'),
        '1',
        expect.any(Number),
      );
    });
  });
});
