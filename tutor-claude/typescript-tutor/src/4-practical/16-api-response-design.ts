/**
 * ============================================================================
 * 16. API 응답 타입 설계 (Practical)
 * ============================================================================
 *
 * 백엔드/프론트 모두에서 반복되는 "API 응답 모양"을 타입으로 설계합니다.
 * 핵심 원칙: (1) 일관된 응답 래퍼  (2) DTO 와 도메인 모델의 분리
 *
 * 실행:  npx tsx src/4-practical/16-api-response-design.ts
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1) 제네릭 응답 래퍼
// ----------------------------------------------------------------------------
// 성공/실패를 하나의 타입으로 (판별 유니온 — 10번 레슨 복습)
interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}
type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// 응답 생성 헬퍼
function ok<T>(data: T): SuccessResponse<T> {
  return { success: true, data, timestamp: new Date().toISOString() };
}
function fail(code: string, message: string, details?: unknown): ErrorResponse {
  return { success: false, error: { code, message, details }, timestamp: new Date().toISOString() };
}

// ----------------------------------------------------------------------------
// 2) 페이지네이션 응답
// ----------------------------------------------------------------------------
interface Page<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
  };
}

function paginate<T>(allItems: T[], page: number, pageSize: number): Page<T> {
  const totalItems = allItems.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = (page - 1) * pageSize;
  return {
    items: allItems.slice(start, start + pageSize),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
    },
  };
}

// ----------------------------------------------------------------------------
// 3) DTO ↔ 도메인 모델 분리
// ----------------------------------------------------------------------------
// 도메인 모델: 앱 내부에서 다루는 형태 (Date 객체, 계산된 값 등)
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date; // Date 객체
  isActive: boolean;
}

// DTO(Data Transfer Object): 네트워크로 오가는 형태 (JSON — 문자열, 숫자만)
interface UserDto {
  id: number;
  name: string;
  email: string;
  createdAt: string; // ISO 문자열
  isActive: boolean;
}

// 변환 함수(mapper) — 경계에서 한 번만 변환하고, 내부에서는 도메인 모델만 사용
function toUserDto(user: User): UserDto {
  return { ...user, createdAt: user.createdAt.toISOString() };
}
function fromUserDto(dto: UserDto): User {
  return { ...dto, createdAt: new Date(dto.createdAt) };
}

// 민감정보 제외한 응답 DTO는 유틸리티 타입으로 (11번 레슨 복습)
interface UserWithPassword extends User {
  passwordHash: string;
}
type PublicUserDto = Omit<UserWithPassword, 'passwordHash' | 'createdAt'> & { createdAt: string };

// ----------------------------------------------------------------------------
// 4) 타입 안전하게 응답 소비하기 (프론트 입장)
// ----------------------------------------------------------------------------
function handleResponse<T>(res: ApiResponse<T>): T {
  if (res.success) {
    return res.data; // 여기서 res 는 SuccessResponse<T> 로 좁혀짐
  }
  // 여기서 res 는 ErrorResponse
  throw new Error(`[${res.error.code}] ${res.error.message}`);
}

// ----------------------------------------------------------------------------
// 실행 결과 확인
// ----------------------------------------------------------------------------
console.log('--- 16. API 응답 타입 설계 ---');

const users: User[] = Array.from({ length: 7 }, (_, i) => ({
  id: i + 1,
  name: `사용자${i + 1}`,
  email: `user${i + 1}@example.com`,
  createdAt: new Date(2026, 0, i + 1),
  isActive: i % 2 === 0,
}));

const pageResult = paginate(users.map(toUserDto), 2, 3);
const response = ok(pageResult);
console.log('응답:', JSON.stringify(response, null, 2));

const errorResponse = fail('USER_NOT_FOUND', '사용자를 찾을 수 없습니다', { id: 999 });
console.log('에러 응답:', errorResponse.error);

const consumed = handleResponse(response);
console.log('소비된 데이터의 아이템 수:', consumed.items.length, '| hasNext:', consumed.pagination.hasNext);

try {
  handleResponse(errorResponse);
} catch (e) {
  console.log('에러 응답 소비 시:', (e as Error).message);
}

console.log('도메인→DTO→도메인 왕복:', fromUserDto(toUserDto(users[0]!)).createdAt instanceof Date);

export {};
