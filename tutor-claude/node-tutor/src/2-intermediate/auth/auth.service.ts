/**
 * ============================================
 * Auth Service - 인증 서비스
 * ============================================
 *
 * 역할:
 * - 사용자 로그인 처리
 * - 토큰 생성 및 검증
 * - 비밀번호 해싱 (실무에서는 bcrypt 사용)
 *
 * 실무 구현 vs 이 예제:
 * - 실무: jsonwebtoken 또는 @nestjs/jwt 패키지 사용
 * - 이 예제: 원리 이해를 위해 Node.js 내장 crypto 모듈로 구현
 *
 * JWT (JSON Web Token) 구조:
 * header.payload.signature
 * - header: 알고리즘 정보 (base64 인코딩)
 * - payload: 사용자 데이터 (base64 인코딩)
 * - signature: 위변조 방지 서명 (HMAC-SHA256)
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

export interface TokenPayload {
  id: number;
  email: string;
  role: string;
}

/**
 * 토큰 구성요소
 */
interface TokenParts {
  header: string;   // base64({"alg":"HS256"})
  payload: string;  // base64(사용자 정보)
  signature: string; // HMAC-SHA256 서명
}

@Injectable()
export class AuthService {
  /**
   * 토큰 서명에 사용할 비밀키
   * - 실무에서는 환경변수로 관리
   * - 절대 코드에 하드코딩 금지!
   *
   * 실무:
   * private readonly secret = process.env.JWT_SECRET;
   */
  private readonly secret = 'MY_SUPER_SECRET_KEY_CHANGE_IN_PRODUCTION';

  /**
   * 로그인 처리
   * ===========
   * 사용자 자격증명 확인 후 토큰 발급
   *
   * @param email - 이메일
   * @param password - 비밀번호
   * @param users - 사용자 목록 (실제로는 DB에서 조회)
   */
  async login(
    email: string,
    password: string,
    users: any[],
  ): Promise<{ accessToken: string; user: TokenPayload }> {
    // 이메일로 사용자 찾기
    const user = users.find((u) => u.email === email);

    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    /**
     * 비밀번호 검증
     * - 실무에서는 bcrypt.compare() 사용
     * - 이 예제에서는 단순 해시 비교
     *
     * 실무 예시:
     * const isValid = await bcrypt.compare(password, user.passwordHash);
     */
    const isPasswordValid = this.hashPassword(password) === user.passwordHash;

    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    // 토큰 페이로드 구성
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    // 액세스 토큰 생성
    const accessToken = this.generateToken(payload);

    return { accessToken, user: payload };
  }

  /**
   * 토큰 생성
   * =========
   * JWT 형식 (header.payload.signature)으로 토큰 생성
   */
  generateToken(payload: TokenPayload): string {
    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    ).toString('base64url');

    const tokenPayload = Buffer.from(
      JSON.stringify({
        ...payload,
        iat: Math.floor(Date.now() / 1000),           // 발급 시간
        exp: Math.floor(Date.now() / 1000) + 60 * 60, // 만료: 1시간
      }),
    ).toString('base64url');

    // HMAC-SHA256으로 서명 생성
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(`${header}.${tokenPayload}`)
      .digest('base64url');

    return `${header}.${tokenPayload}.${signature}`;
  }

  /**
   * 토큰 검증
   * =========
   * 토큰 유효성 확인 및 페이로드 추출
   *
   * @param token - 검증할 토큰
   * @returns 페이로드 (유효한 경우)
   * @throws UnauthorizedException - 유효하지 않은 토큰
   */
  verifyToken(token: string): TokenPayload {
    const parts = token.split('.');

    if (parts.length !== 3) {
      throw new UnauthorizedException('유효하지 않은 토큰 형식입니다');
    }

    const [header, payload, signature] = parts;

    // 서명 재생성으로 위변조 확인
    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      throw new UnauthorizedException('토큰이 위변조되었습니다');
    }

    // 페이로드 디코딩
    let decoded: any;
    try {
      decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
    } catch {
      throw new UnauthorizedException('토큰 파싱 실패');
    }

    // 만료 시간 확인
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('토큰이 만료되었습니다. 다시 로그인해주세요');
    }

    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
  }

  /**
   * 비밀번호 해싱
   * ============
   * 실무에서는 bcrypt 사용 (단방향 해시 + salt)
   *
   * 실무 예시:
   * const hash = await bcrypt.hash(password, 10); // 10 = salt rounds
   */
  hashPassword(password: string): string {
    return crypto
      .createHmac('sha256', this.secret)
      .update(password)
      .digest('hex');
  }
}

/**
 * 실무 JWT 구현 (@nestjs/jwt 사용)
 * ==================================
 *
 * 1. 설치:
 *    npm install @nestjs/jwt @nestjs/passport passport passport-jwt
 *
 * 2. JwtModule 등록:
 *    JwtModule.register({
 *      secret: process.env.JWT_SECRET,
 *      signOptions: { expiresIn: '1h' },
 *    })
 *
 * 3. Service에서 사용:
 *    constructor(private jwtService: JwtService) {}
 *
 *    async login(user: User): Promise<string> {
 *      const payload = { sub: user.id, email: user.email };
 *      return this.jwtService.sign(payload);
 *    }
 *
 *    verifyToken(token: string): any {
 *      return this.jwtService.verify(token);
 *    }
 *
 * Refresh Token 패턴:
 * - Access Token: 짧은 유효기간 (15분~1시간)
 * - Refresh Token: 긴 유효기간 (7일~30일)
 * - Access Token 만료 시 Refresh Token으로 재발급
 */
