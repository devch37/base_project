/**
 * 표준 API 응답 봉투(envelope).
 * TransformInterceptor 가 컨트롤러 반환값을 이 형태로 감쌉니다.
 * 프론트엔드가 항상 동일한 구조를 기대할 수 있어 통신이 단순해집니다.
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
  timestamp: string;
  path: string;
}

/** 에러 응답(전역 예외 필터가 생성) */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}
