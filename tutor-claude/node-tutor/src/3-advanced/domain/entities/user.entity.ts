/**
 * ============================================
 * User Domain Entity - 사용자 도메인 엔티티
 * ============================================
 */

import { Email } from '../value-objects/email.vo';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export class User {
  private readonly _id: number;
  private readonly _email: Email;
  private _username: string;
  private _passwordHash: string;
  private _role: UserRole;
  private _isActive: boolean;
  private _lastLoginAt?: Date;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(params: {
    id: number;
    email: Email;
    username: string;
    passwordHash: string;
    role?: UserRole;
    isActive?: boolean;
    lastLoginAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this._id = params.id;
    this._email = params.email;
    this._username = params.username;
    this._passwordHash = params.passwordHash;
    this._role = params.role ?? UserRole.USER;
    this._isActive = params.isActive ?? true;
    this._lastLoginAt = params.lastLoginAt;
    this._createdAt = params.createdAt ?? new Date();
    this._updatedAt = params.updatedAt ?? new Date();
  }

  static create(params: {
    id: number;
    email: string;
    username: string;
    passwordHash: string;
    role?: UserRole;
  }): User {
    return new User({
      id: params.id,
      email: Email.create(params.email),
      username: params.username,
      passwordHash: params.passwordHash,
      role: params.role ?? UserRole.USER,
    });
  }

  static reconstitute(params: {
    id: number;
    email: string;
    username: string;
    passwordHash: string;
    role: UserRole;
    isActive: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User({
      id: params.id,
      email: Email.create(params.email),
      username: params.username,
      passwordHash: params.passwordHash,
      role: params.role,
      isActive: params.isActive,
      lastLoginAt: params.lastLoginAt,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
    });
  }

  recordLogin(): void {
    this._lastLoginAt = new Date();
    this._updatedAt = new Date();
  }

  deactivate(): void {
    if (!this._isActive) {
      throw new Error('이미 비활성화된 계정입니다');
    }
    this._isActive = false;
    this._updatedAt = new Date();
  }

  isAdmin(): boolean {
    return this._role === UserRole.ADMIN;
  }

  get id(): number { return this._id; }
  get email(): Email { return this._email; }
  get username(): string { return this._username; }
  get passwordHash(): string { return this._passwordHash; }
  get role(): UserRole { return this._role; }
  get isActive(): boolean { return this._isActive; }
  get lastLoginAt(): Date | undefined { return this._lastLoginAt; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
}
