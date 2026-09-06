/**
 * ============================================================================
 * users.service.spec.ts — 서비스 단위 테스트 (unit test)
 * ----------------------------------------------------------------------------
 * 핵심: Repository 와 HashingService 를 "가짜(mock)"로 주입해서
 *       DB 없이 UsersService 의 로직만 검증합니다.
 *
 * Test.createTestingModule 이 미니 DI 컨테이너를 만들어 줍니다.
 * ============================================================================
 */
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HashingService } from '../../common/hashing/hashing.service';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  // 각 메서드를 jest.fn() 으로 대체한 가짜 리포지토리
  const repo = {
    exists: jest.fn(),
    create: jest.fn((dto) => dto),
    save: jest.fn((entity) => Promise.resolve({ id: 1, ...entity })),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const hashing = {
    hash: jest.fn().mockResolvedValue('hashed-pw'),
    compare: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: HashingService, useValue: hashing },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  describe('create', () => {
    it('이메일이 중복되지 않으면 비밀번호를 해싱해 저장한다', async () => {
      repo.exists.mockResolvedValue(false);

      const result = await service.create({
        email: 'new@example.com',
        nickname: '신규',
        password: 'Passw0rd!',
      });

      expect(hashing.hash).toHaveBeenCalledWith('Passw0rd!');
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          password: 'hashed-pw',
        }),
      );
      expect(result.id).toBe(1);
    });

    it('이메일이 이미 있으면 ConflictException 을 던진다', async () => {
      repo.exists.mockResolvedValue(true);

      await expect(
        service.create({
          email: 'dup@example.com',
          nickname: '중복',
          password: 'Passw0rd!',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('사용자가 없으면 NotFoundException 을 던진다', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findById(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('사용자가 있으면 그대로 반환한다', async () => {
      const user = { id: 7, email: 'a@a.com' };
      repo.findOne.mockResolvedValue(user);
      await expect(service.findById(7)).resolves.toBe(user);
    });
  });

  describe('remove', () => {
    it('삭제 대상이 없으면(affected=0) NotFoundException', async () => {
      repo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.remove(1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
