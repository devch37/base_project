/**
 * ============================================
 * API 서비스 계층 (API Service Layer)
 * ============================================
 *
 * 모든 HTTP 요청을 관리하는 서비스 계층입니다.
 *
 * 학습 포인트:
 * 1. Axios 인스턴스 설정
 * 2. Request/Response 인터셉터
 * 3. 에러 처리 중앙화
 * 4. 타입 안전한 API 호출
 * 5. 인증 토큰 관리
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import type {
  Task,
  User,
  CreateTaskInput,
  UpdateTaskInput,
  LoginInput,
  RegisterInput,
  ApiResponse,
  ApiError,
} from '../types';

// ============================================
// Axios 인스턴스 생성
// ============================================

/**
 * 기본 API 클라이언트
 *
 * Axios 인스턴스를 생성하여 공통 설정을 적용합니다.
 * - baseURL: 모든 요청의 기본 URL
 * - timeout: 요청 타임아웃
 * - headers: 공통 헤더
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000, // 10초
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// Request 인터셉터
// ============================================

/**
 * 요청 인터셉터
 *
 * 모든 요청이 서버로 전송되기 전에 실행됩니다.
 * 주로 인증 토큰을 헤더에 추가하는 용도로 사용합니다.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 로컬 스토리지에서 토큰 가져오기
    const token = localStorage.getItem('authToken');

    // 토큰이 있으면 Authorization 헤더에 추가
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 요청 로깅 (개발 환경에서만)
    if (import.meta.env.DEV) {
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    // 요청 설정 중 에러 발생
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ============================================
// Response 인터셉터
// ============================================

/**
 * 응답 인터셉터
 *
 * 서버 응답을 받은 후 처리합니다.
 * - 성공 응답: 데이터 추출
 * - 에러 응답: 통일된 에러 형식으로 변환
 */
apiClient.interceptors.response.use(
  (response) => {
    // 응답 로깅 (개발 환경에서만)
    if (import.meta.env.DEV) {
      console.log('API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }

    // 응답 데이터 반환
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    // 에러 응답 처리
    if (error.response) {
      // 서버가 응답을 반환한 경우 (4xx, 5xx)
      const { status, data } = error.response;

      // 401 Unauthorized - 인증 만료
      if (status === 401) {
        // 토큰 제거 및 로그인 페이지로 리다이렉트
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }

      // 403 Forbidden - 권한 없음
      if (status === 403) {
        console.error('Access denied');
      }

      // 404 Not Found
      if (status === 404) {
        console.error('Resource not found');
      }

      // 500 Internal Server Error
      if (status >= 500) {
        console.error('Server error occurred');
      }

      // 에러 로깅
      console.error('API Error:', {
        status,
        message: data?.message || error.message,
        url: error.config?.url,
      });

      // 에러 객체 반환
      return Promise.reject({
        message: data?.message || 'An error occurred',
        code: data?.code || `HTTP_${status}`,
        details: data?.details,
      } as ApiError);
    } else if (error.request) {
      // 요청은 전송되었으나 응답을 받지 못한 경우 (네트워크 에러)
      console.error('Network error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
      } as ApiError);
    } else {
      // 요청 설정 중 에러가 발생한 경우
      console.error('Request setup error:', error.message);
      return Promise.reject({
        message: error.message,
        code: 'REQUEST_ERROR',
      } as ApiError);
    }
  }
);

// ============================================
// Auth API
// ============================================

/**
 * 인증 관련 API
 */
export const authApi = {
  /**
   * 로그인
   *
   * @param credentials - 로그인 정보
   * @returns 사용자 정보와 토큰
   */
  login: async (credentials: LoginInput): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await apiClient.post<ApiResponse<{ user: User; token: string }>>(
      '/auth/login',
      credentials
    );
    return response.data;
  },

  /**
   * 회원가입
   */
  register: async (data: RegisterInput): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await apiClient.post<ApiResponse<{ user: User; token: string }>>(
      '/auth/register',
      data
    );
    return response.data;
  },

  /**
   * 로그아웃
   */
  logout: async (): Promise<ApiResponse<null>> => {
    const response = await apiClient.post<ApiResponse<null>>('/auth/logout');
    return response.data;
  },

  /**
   * 현재 사용자 정보 조회
   */
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data;
  },

  /**
   * 토큰 갱신
   */
  refreshToken: async (): Promise<ApiResponse<{ token: string }>> => {
    const response = await apiClient.post<ApiResponse<{ token: string }>>('/auth/refresh');
    return response.data;
  },
};

// ============================================
// Task API
// ============================================

/**
 * 작업 관련 API
 */
export const taskApi = {
  /**
   * 모든 작업 조회
   *
   * @param params - 쿼리 파라미터 (필터, 정렬 등)
   * @returns 작업 배열
   */
  getTasks: async (params?: AxiosRequestConfig['params']): Promise<ApiResponse<Task[]>> => {
    const response = await apiClient.get<ApiResponse<Task[]>>('/tasks', { params });
    return response.data;
  },

  /**
   * 특정 작업 조회
   *
   * @param id - 작업 ID
   * @returns 작업 상세 정보
   */
  getTask: async (id: string): Promise<ApiResponse<Task>> => {
    const response = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`);
    return response.data;
  },

  /**
   * 작업 생성
   *
   * @param data - 작업 데이터
   * @returns 생성된 작업
   */
  createTask: async (data: CreateTaskInput): Promise<ApiResponse<Task>> => {
    const response = await apiClient.post<ApiResponse<Task>>('/tasks', data);
    return response.data;
  },

  /**
   * 작업 수정
   *
   * @param id - 작업 ID
   * @param data - 수정할 데이터
   * @returns 수정된 작업
   */
  updateTask: async (id: string, data: UpdateTaskInput): Promise<ApiResponse<Task>> => {
    const response = await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}`, data);
    return response.data;
  },

  /**
   * 작업 삭제
   *
   * @param id - 작업 ID
   * @returns 삭제 결과
   */
  deleteTask: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete<ApiResponse<null>>(`/tasks/${id}`);
    return response.data;
  },

  /**
   * 작업 순서 변경 (드래그 앤 드롭)
   *
   * @param id - 작업 ID
   * @param newOrder - 새로운 순서
   * @param newStatus - 새로운 상태 (선택적)
   * @returns 수정된 작업
   */
  reorderTask: async (
    id: string,
    newOrder: number,
    newStatus?: string
  ): Promise<ApiResponse<Task>> => {
    const response = await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}/reorder`, {
      order: newOrder,
      status: newStatus,
    });
    return response.data;
  },
};

// ============================================
// User API
// ============================================

/**
 * 사용자 관련 API
 */
export const userApi = {
  /**
   * 모든 사용자 조회
   */
  getUsers: async (): Promise<ApiResponse<User[]>> => {
    const response = await apiClient.get<ApiResponse<User[]>>('/users');
    return response.data;
  },

  /**
   * 특정 사용자 조회
   */
  getUser: async (id: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return response.data;
  },

  /**
   * 사용자 프로필 수정
   */
  updateProfile: async (id: string, data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await apiClient.patch<ApiResponse<User>>(`/users/${id}`, data);
    return response.data;
  },
};

// ============================================
// 헬퍼 함수
// ============================================

/**
 * API 에러인지 확인하는 타입 가드
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error
  );
}

/**
 * 에러 메시지 추출
 *
 * @param error - 에러 객체
 * @returns 사용자에게 표시할 에러 메시지
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '알 수 없는 오류가 발생했습니다.';
}

// ============================================
// 기본 export
// ============================================

/**
 * API 객체를 기본으로 export
 * 사용 예: import api from './services/api';
 *          api.task.getTasks();
 */
export default {
  auth: authApi,
  task: taskApi,
  user: userApi,
  client: apiClient, // 직접 요청이 필요한 경우
};

/**
 * 학습 노트:
 *
 * 1. Axios 인스턴스
 *    - 공통 설정을 한 번만 정의
 *    - baseURL, timeout, headers 등
 *
 * 2. 인터셉터 (Interceptors)
 *    - Request: 요청 전 처리 (인증 토큰 추가)
 *    - Response: 응답 후 처리 (에러 핸들링)
 *
 * 3. 타입 안전성
 *    - 제네릭으로 응답 타입 지정
 *    - apiClient.get<ApiResponse<Task[]>>
 *
 * 4. 에러 처리 중앙화
 *    - 모든 API 에러를 한 곳에서 처리
 *    - HTTP 상태 코드별 로직 분기
 *
 * 5. 인증 흐름
 *    - 로그인 시 토큰 저장
 *    - 모든 요청에 토큰 자동 추가
 *    - 401 에러 시 자동 로그아웃
 *
 * 6. API 그룹화
 *    - authApi, taskApi, userApi로 분리
 *    - 관련 있는 API를 논리적으로 그룹화
 *
 * 7. 환경 변수
 *    - import.meta.env로 Vite 환경 변수 접근
 *    - VITE_ 접두사 필수
 */
