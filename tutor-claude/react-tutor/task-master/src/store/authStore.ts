/**
 * ============================================
 * 인증 상태 관리 (Auth Store)
 * ============================================
 *
 * Zustand를 사용한 전역 상태 관리입니다.
 *
 * 학습 포인트:
 * 1. Zustand 기본 사용법
 * 2. 상태와 액션 정의
 * 3. TypeScript와의 통합
 * 4. 영속성 (Persist Middleware)
 * 5. Immer 패턴 (불변성)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

// ============================================
// 타입 정의
// ============================================

/**
 * 인증 상태 인터페이스
 */
interface AuthState {
  // 상태 (State)
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // 액션 (Actions)
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

// ============================================
// Zustand Store 생성
// ============================================

/**
 * 인증 상태 스토어
 *
 * create() 함수로 스토어를 생성합니다.
 * set 함수를 사용하여 상태를 업데이트합니다.
 * get 함수로 현재 상태를 읽을 수 있습니다.
 */
export const useAuthStore = create<AuthState>()(
  // persist 미들웨어: 로컬 스토리지에 자동 저장
  persist(
    (set, get) => ({
      // ========================================
      // 초기 상태 (Initial State)
      // ========================================

      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // ========================================
      // 액션 (Actions)
      // ========================================

      /**
       * 사용자 정보 설정
       *
       * set 함수는 상태를 업데이트합니다.
       * 이전 상태를 스프레드하고 변경할 부분만 덮어씁니다.
       */
      setUser: (user) =>
        set((state) => ({
          ...state,
          user,
          isAuthenticated: user !== null,
        })),

      /**
       * 토큰 설정
       */
      setToken: (token) =>
        set((state) => ({
          ...state,
          token,
        })),

      /**
       * 로딩 상태 설정
       */
      setLoading: (isLoading) =>
        set((state) => ({
          ...state,
          isLoading,
        })),

      /**
       * 로그인
       *
       * 여러 상태를 한 번에 업데이트합니다.
       */
      login: (user, token) =>
        set(() => ({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        })),

      /**
       * 로그아웃
       *
       * 모든 인증 관련 상태를 초기화합니다.
       */
      logout: () =>
        set(() => ({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })),

      /**
       * 사용자 정보 업데이트
       *
       * get() 함수로 현재 상태를 읽고,
       * 부분적으로 업데이트합니다.
       */
      updateUser: (updates) =>
        set(() => {
          const currentUser = get().user;
          if (!currentUser) return {};

          return {
            user: {
              ...currentUser,
              ...updates,
            },
          };
        }),
    }),
    {
      // persist 옵션
      name: 'auth-storage', // 로컬 스토리지 키
      // 특정 필드만 저장 (isLoading은 제외)
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ============================================
// 셀렉터 (Selectors)
// ============================================

/**
 * 셀렉터는 상태의 일부만 선택하여 반환하는 함수입니다.
 * 컴포넌트에서 필요한 상태만 구독하여 불필요한 리렌더링을 방지합니다.
 */

/**
 * 현재 사용자 선택
 *
 * 사용 예:
 * const user = useAuthStore(selectUser);
 */
export const selectUser = (state: AuthState) => state.user;

/**
 * 인증 상태 선택
 */
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;

/**
 * 로딩 상태 선택
 */
export const selectIsLoading = (state: AuthState) => state.isLoading;

/**
 * 사용자 역할 선택
 */
export const selectUserRole = (state: AuthState) => state.user?.role;

/**
 * 사용자 이름 선택
 */
export const selectUserName = (state: AuthState) => state.user?.name;

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 사용자가 특정 역할인지 확인
 */
export function useHasRole(role: string): boolean {
  const userRole = useAuthStore(selectUserRole);
  return userRole === role;
}

/**
 * 학습 노트:
 *
 * 1. Zustand 기본 개념
 *    - create()로 스토어 생성
 *    - set()으로 상태 업데이트
 *    - get()으로 현재 상태 읽기
 *
 * 2. TypeScript 통합
 *    - Interface로 상태 타입 정의
 *    - 타입 안전한 상태 관리
 *
 * 3. Persist Middleware
 *    - 로컬 스토리지에 자동 저장
 *    - 새로고침 후에도 상태 유지
 *    - partialize로 저장할 필드 선택
 *
 * 4. 셀렉터 패턴
 *    - 필요한 상태만 선택
 *    - 불필요한 리렌더링 방지
 *    - 코드 재사용성 향상
 *
 * 5. 컴포넌트에서 사용하기
 *    ```tsx
 *    // 전체 스토어 사용
 *    const { user, login, logout } = useAuthStore();
 *
 *    // 특정 상태만 선택 (권장)
 *    const user = useAuthStore(selectUser);
 *    const login = useAuthStore(state => state.login);
 *    ```
 *
 * 6. 상태 업데이트 패턴
 *    - 불변성 유지: 스프레드 연산자 사용
 *    - 함수형 업데이트: set(state => ({ ...state, ... }))
 *    - 직접 업데이트: set({ user: newUser })
 *
 * 7. Zustand vs Redux
 *    - Zustand: 간단, 보일러플레이트 적음
 *    - Redux: 복잡한 앱, 미들웨어 많음
 *    - 중소규모 프로젝트에서 Zustand 권장
 */
