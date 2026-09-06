/**
 * ============================================================================
 * users.service.ts — 사용자 도메인 비즈니스 로직
 * ----------------------------------------------------------------------------
 * 컨트롤러는 HTTP 만, 서비스는 "무엇을 하는가"만 담당합니다(관심사 분리).
 * Repository<User> 를 주입받아 DB 에 접근합니다.
 * ============================================================================
 */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HashingService } from '../../common/hashing/hashing.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly hashing: HashingService,
  ) {}

  /** 회원 생성 (비밀번호 해싱 포함). 이메일 중복이면 409. */
  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.usersRepo.exists({ where: { email: dto.email } });
    if (exists) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    const user = this.usersRepo.create({
      email: dto.email,
      nickname: dto.nickname,
      password: await this.hashing.hash(dto.password),
    });
    return this.usersRepo.save(user);
  }

  findAll(): Promise<User[]> {
    return this.usersRepo.find({ order: { createdAt: 'DESC' } });
  }

  /** id 로 조회, 없으면 404 */
  async findById(id: number): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`사용자(#${id})를 찾을 수 없습니다.`);
    }
    return user;
  }

  /**
   * 로그인 검증용 — password 컬럼은 select:false 이므로 명시적으로 포함시켜 조회.
   * 존재하지 않으면 null 을 반환(예외 대신) — 호출부에서 401 로 처리.
   */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect(['user.password', 'user.hashedRefreshToken'])
      .where('user.email = :email', { email })
      .getOne();
  }

  findByIdWithRefreshToken(id: number): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.hashedRefreshToken')
      .where('user.id = :id', { id })
      .getOne();
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, dto); // 넘어온 필드만 덮어쓰기
    return this.usersRepo.save(user);
  }

  async remove(id: number): Promise<void> {
    const result = await this.usersRepo.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`사용자(#${id})를 찾을 수 없습니다.`);
    }
  }

  /** 리프레시 토큰 해시 저장/삭제 (auth 모듈에서 사용) */
  setHashedRefreshToken(
    id: number,
    hashedRefreshToken: string | null,
  ): Promise<unknown> {
    return this.usersRepo.update(id, { hashedRefreshToken });
  }
}
