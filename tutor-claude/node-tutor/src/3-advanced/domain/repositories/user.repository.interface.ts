/**
 * ============================================
 * User Repository Interface - 사용자 저장소 인터페이스
 * ============================================
 */

import { User } from '../entities/user.entity';

export interface IUserRepository {
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
  delete(id: number): Promise<void>;
  existsByEmail(email: string): Promise<boolean>;
  nextId(): Promise<number>;
}

export const USER_REPOSITORY = 'USER_REPOSITORY';
