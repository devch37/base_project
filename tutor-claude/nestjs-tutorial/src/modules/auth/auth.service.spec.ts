/**
 * ============================================================================
 * auth.service.spec.ts — 인증 로직 단위 테스트
 * ----------------------------------------------------------------------------
 * UsersService / JwtService / HashingService / MailerService 를 모두 mock.
 * "로그인 실패 시 401", "성공 시 토큰 발급 + 리프레시 해시 저장" 을 검증합니다.
 * ============================================================================
 */
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { HashingService } from '../../common/hashing/hashing.service';
import { MailerService } from '../../common/mailer/mailer.service';
import { jwtConfig } from '../../config/configuration';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const usersService = {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmailWithPassword: jest.fn(),
    setHashedRefreshToken: jest.fn().mockResolvedValue(undefined),
  };
  const jwt = { signAsync: jest.fn().mockResolvedValue('signed-token') };
  const hashing = {
    hash: jest.fn().mockResolvedValue('hashed'),
    compare: jest.fn(),
  };
  const mailer = { sendWelcome: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwt },
        { provide: HashingService, useValue: hashing },
        { provide: MailerService, useValue: mailer },
        {
          provide: jwtConfig.KEY,
          useValue: {
            accessSecret: 'a',
            accessExpiresIn: '15m',
            refreshSecret: 'r',
            refreshExpiresIn: '7d',
          },
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('login', () => {
    it('존재하지 않는 이메일이면 401 (이메일 유무를 노출하지 않음)', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@x.com', password: 'whatever1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('비밀번호가 틀리면 401', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 1,
        email: 'a@a.com',
        password: 'hash',
      });
      hashing.compare.mockResolvedValue(false);

      await expect(
        service.login({ email: 'a@a.com', password: 'wrongpass1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('성공하면 토큰 쌍을 발급하고 리프레시 해시를 저장한다', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue({
        id: 42,
        email: 'a@a.com',
        role: 'user',
        password: 'hash',
      });
      hashing.compare.mockResolvedValue(true);

      const { tokens } = await service.login({
        email: 'a@a.com',
        password: 'correct1!',
      });

      expect(tokens.accessToken).toBe('signed-token');
      expect(tokens.refreshToken).toBe('signed-token');
      expect(jwt.signAsync).toHaveBeenCalledTimes(2);
      expect(usersService.setHashedRefreshToken).toHaveBeenCalledWith(
        42,
        'hashed',
      );
    });
  });

  describe('register', () => {
    it('사용자 생성 후 환영 메일을 보낸다', async () => {
      usersService.create.mockResolvedValue({
        id: 1,
        email: 'new@x.com',
        nickname: '신규',
        role: 'user',
      });

      await service.register({
        email: 'new@x.com',
        nickname: '신규',
        password: 'Passw0rd!',
      });

      expect(mailer.sendWelcome).toHaveBeenCalledWith('new@x.com', '신규');
    });
  });
});
