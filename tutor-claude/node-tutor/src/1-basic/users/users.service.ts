import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private users: User[] = [];
  private currentId: number = 1;

  constructor() {
    // 샘플 데이터
    this.users.push(
      new User({
        id: this.currentId++,
        email: 'admin@example.com',
        name: '관리자',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  }

  async findAll(): Promise<User[]> {
    return this.users;
  }

  async findOne(id: number): Promise<User> {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException(`사용자 ID ${id}를 찾을 수 없습니다.`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find((u) => u.email === email);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // 이메일 중복 체크
    const existing = await this.findByEmail(createUserDto.email);
    if (existing) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    const newUser = new User({
      id: this.currentId++,
      email: createUserDto.email,
      name: createUserDto.name,
      role: createUserDto.role || 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.users.push(newUser);
    return newUser;
  }
}
