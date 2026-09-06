/**
 * ============================================================================
 * HashingService — 비밀번호/토큰 해싱을 한 곳에 캡슐화
 * ----------------------------------------------------------------------------
 * 왜 서비스로 감쌀까?
 *  1) 테스트에서 목(mock)으로 갈아끼우기 쉽다 (느린 bcrypt 대신 fake)
 *  2) 나중에 bcrypt → argon2 로 교체할 때 이 파일만 바꾸면 된다 (의존성 격리)
 *
 * 라이브러리 선택:
 *  - bcryptjs (여기서 사용): 순수 JS, 네이티브 빌드 불필요, 실무에서도 널리 쓰임
 *  - bcrypt:  네이티브 바인딩, 약간 더 빠름
 *  - argon2:  현대적 권장 알고리즘 (메모리-하드)
 * ============================================================================
 */
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class HashingService {
  private readonly saltRounds = 10; // 비용(cost) 인자. 높을수록 느리고 안전

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
