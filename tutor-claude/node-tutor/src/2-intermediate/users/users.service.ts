/**
 * ============================================
 * Users Service - 사용자 서비스 (Intermediate)
 * ============================================
 *
 * 1단계 대비 추가된 내용:
 * - 회원가입 (비밀번호 해싱)
 * - 로그인 (JWT 토큰 발급)
 * - AuthService 의존성 주입
 */

import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../guards/roles.decorator';

@Injectable()
export class UsersService {
  private users: User[] = [];
  private currentId = 1;

  /**
   * 의존성 주입
   * - AuthService를 주입받아 토큰 생성/비밀번호 해싱 위임
   */
  constructor(private readonly authService: AuthService) {
    // 기본 관리자 계정 생성
    this.users.push(
      new User({
        id: this.currentId++,
        email: 'admin@example.com',
        username: 'admin',
        passwordHash: this.authService.hashPassword('Admin1234!'),
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      new User({
        id: this.currentId++,
        email: 'user@example.com',
        username: 'user1',
        passwordHash: this.authService.hashPassword('User1234!'),
        role: UserRole.USER,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  }

  /**
   * 회원가입
   * ========
   * 1. DTO 검증
   * 2. 이메일 중복 확인
   * 3. 비밀번호 해싱
   * 4. 사용자 저장
   */
  async register(createUserDto: CreateUserDto): Promise<User> {
    // 1. DTO 검증
    const errors = CreateUserDto.validate(createUserDto);
    if (errors.length > 0) {
      throw new BadRequestException({ message: '입력값 검증 실패', errors });
    }

    // 2. 이메일 중복 확인
    const existingUser = this.users.find(
      (u) => u.email === createUserDto.email.toLowerCase(),
    );
    if (existingUser) {
      throw new ConflictException('이미 사용 중인 이메일입니다');
    }

    // 3. 사용자 생성 (비밀번호 해싱)
    const newUser = new User({
      id: this.currentId++,
      email: createUserDto.email.toLowerCase(),
      username: createUserDto.username,
      passwordHash: this.authService.hashPassword(createUserDto.password),
      role: UserRole.USER, // 일반 사용자로 고정 (보안)
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.users.push(newUser);
    return newUser;
  }

  /**
   * 로그인
   * ======
   * 1. 이메일/비밀번호 검증
   * 2. JWT 토큰 발급
   * 3. lastLoginAt 업데이트
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const errors = LoginDto.validate(loginDto);
    if (errors.length > 0) {
      throw new BadRequestException({ message: '입력값 검증 실패', errors });
    }

    const { accessToken, user } = await this.authService.login(
      loginDto.email,
      loginDto.password,
      this.users,
    );

    // 마지막 로그인 시간 업데이트
    const dbUser = this.users.find((u) => u.id === user.id);
    if (dbUser) {
      dbUser.lastLoginAt = new Date();
    }

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: dbUser?.username,
        role: user.role,
      },
      expiresIn: 3600, // 1시간
    };
  }

  async findAll(): Promise<User[]> {
    return this.users.filter((u) => u.isActive);
  }

  async findOne(id: number): Promise<User> {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException(`ID ${id}번 사용자를 찾을 수 없습니다`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find((u) => u.email === email.toLowerCase());
  }

  // AuthService에서 접근할 수 있도록 내부 사용자 목록 노출
  getUsers(): User[] {
    return this.users;
  }
}
