/**
 * ============================================
 * User In-Memory Repository
 * ============================================
 */

import { Injectable } from '@nestjs/common';
import { User, UserRole } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import * as crypto from 'crypto';

@Injectable()
export class UserInMemoryRepository implements IUserRepository {
  private readonly store = new Map<number, User>();
  private idCounter = 1;

  constructor() {
    this.initializeSampleData();
  }

  private hashPassword(password: string): string {
    return crypto.createHmac('sha256', 'SECRET').update(password).digest('hex');
  }

  private initializeSampleData(): void {
    const admin = User.create({
      id: this.idCounter++,
      email: 'admin@example.com',
      username: 'admin',
      passwordHash: this.hashPassword('Admin1234!'),
      role: UserRole.ADMIN,
    });
    this.store.set(admin.id, admin);

    const user = User.create({
      id: this.idCounter++,
      email: 'user@example.com',
      username: 'user1',
      passwordHash: this.hashPassword('User1234!'),
    });
    this.store.set(user.id, user);
  }

  async findById(id: number): Promise<User | null> {
    return this.store.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const found = Array.from(this.store.values()).find(
      (u) => u.email.value === email.toLowerCase(),
    );
    return found ?? null;
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.store.values()).filter((u) => u.isActive);
  }

  async save(user: User): Promise<User> {
    this.store.set(user.id, user);
    return user;
  }

  async update(user: User): Promise<User> {
    this.store.set(user.id, user);
    return user;
  }

  async delete(id: number): Promise<void> {
    this.store.delete(id);
  }

  async existsByEmail(email: string): Promise<boolean> {
    return Array.from(this.store.values()).some(
      (u) => u.email.value === email.toLowerCase(),
    );
  }

  async nextId(): Promise<number> {
    return this.idCounter++;
  }
}
