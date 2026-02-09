/**
 * ============================================
 * 유틸리티 헬퍼 함수 (Utility Helpers)
 * ============================================
 *
 * 재사용 가능한 순수 함수들의 모음입니다.
 *
 * 학습 포인트:
 * 1. 순수 함수 (Pure Functions)
 * 2. 타입 안전성
 * 3. 함수형 프로그래밍 패턴
 * 4. 에러 핸들링
 */

import { format, formatDistance, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Task, TaskStatus, TaskPriority } from '../types';

// ============================================
// 날짜 관련 유틸리티
// ============================================

/**
 * ISO 문자열을 원하는 형식으로 포맷팅
 *
 * @param dateString - ISO 8601 날짜 문자열
 * @param formatString - date-fns 포맷 문자열
 * @returns 포맷된 날짜 문자열
 *
 * 예: formatDate('2024-01-01T00:00:00Z', 'yyyy년 MM월 dd일') => '2024년 01월 01일'
 */
export function formatDate(
  dateString: string,
  formatString: string = 'yyyy-MM-dd'
): string {
  try {
    return format(parseISO(dateString), formatString, { locale: ko });
  } catch (error) {
    console.error('Invalid date string:', dateString, error);
    return dateString;
  }
}

/**
 * 상대적 시간 표시 ('3일 전', '2시간 전' 등)
 *
 * @param dateString - ISO 8601 날짜 문자열
 * @returns 상대적 시간 문자열
 */
export function formatRelativeTime(dateString: string): string {
  try {
    return formatDistance(parseISO(dateString), new Date(), {
      addSuffix: true,
      locale: ko,
    });
  } catch (error) {
    console.error('Invalid date string:', dateString, error);
    return dateString;
  }
}

/**
 * 마감일이 임박했는지 확인
 *
 * @param dueDate - 마감일 ISO 문자열
 * @param daysThreshold - 임박 기준 일수 (기본: 3일)
 * @returns 임박 여부
 */
export function isDueSoon(dueDate?: string, daysThreshold: number = 3): boolean {
  if (!dueDate) return false;

  try {
    const due = parseISO(dueDate);
    const now = new Date();
    const diffInMs = due.getTime() - now.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    return diffInDays > 0 && diffInDays <= daysThreshold;
  } catch (error) {
    console.error('Invalid due date:', dueDate, error);
    return false;
  }
}

/**
 * 마감일이 지났는지 확인
 */
export function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;

  try {
    const due = parseISO(dueDate);
    return due < new Date();
  } catch (error) {
    console.error('Invalid due date:', dueDate, error);
    return false;
  }
}

// ============================================
// 문자열 관련 유틸리티
// ============================================

/**
 * 문자열 자르기 (말줄임표 추가)
 *
 * @param str - 원본 문자열
 * @param maxLength - 최대 길이
 * @returns 잘린 문자열
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

/**
 * 검색어 하이라이트
 *
 * @param text - 원본 텍스트
 * @param query - 검색어
 * @returns 하이라이트된 HTML 문자열
 */
export function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * 정규식 특수문자 이스케이프
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 이메일 유효성 검증
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * URL 슬러그 생성
 * 예: 'Hello World!' => 'hello-world'
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ============================================
// 배열 관련 유틸리티
// ============================================

/**
 * 배열을 특정 필드로 그룹화
 *
 * Generic 함수로 타입 안전성 확보
 *
 * @param array - 원본 배열
 * @param getKey - 키를 추출하는 함수
 * @returns 그룹화된 객체
 *
 * 예: groupBy(tasks, t => t.status) => { todo: [...], in_progress: [...] }
 */
export function groupBy<T, K extends string | number>(
  array: T[],
  getKey: (item: T) => K
): Record<K, T[]> {
  return array.reduce((result, item) => {
    const key = getKey(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
    return result;
  }, {} as Record<K, T[]>);
}

/**
 * 배열에서 중복 제거
 *
 * @param array - 원본 배열
 * @param getKey - 고유 키를 추출하는 함수 (선택적)
 * @returns 중복이 제거된 배열
 */
export function unique<T>(array: T[], getKey?: (item: T) => unknown): T[] {
  if (!getKey) {
    return Array.from(new Set(array));
  }

  const seen = new Set();
  return array.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * 배열 정렬 (원본 배열 변경 없이)
 *
 * @param array - 원본 배열
 * @param compareFn - 비교 함수
 * @returns 정렬된 새 배열
 */
export function sortBy<T>(
  array: T[],
  compareFn: (a: T, b: T) => number
): T[] {
  return [...array].sort(compareFn);
}

// ============================================
// 객체 관련 유틸리티
// ============================================

/**
 * 깊은 복사 (Deep Clone)
 *
 * 주의: 함수, Symbol, undefined는 복사되지 않습니다.
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 객체에서 null/undefined 값 제거
 */
export function removeNullish<T extends Record<string, unknown>>(
  obj: T
): Partial<T> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined) {
      (acc as any)[key] = value;
    }
    return acc;
  }, {} as Partial<T>);
}

// ============================================
// Task 관련 유틸리티
// ============================================

/**
 * 작업 필터링
 *
 * @param tasks - 작업 배열
 * @param filters - 필터 조건
 * @returns 필터링된 작업 배열
 */
export function filterTasks(
  tasks: Task[],
  filters: {
    status?: TaskStatus | 'all';
    priority?: TaskPriority | 'all';
    assigneeId?: string | 'all';
    search?: string;
    tags?: string[];
  }
): Task[] {
  return tasks.filter((task) => {
    // 상태 필터
    if (filters.status && filters.status !== 'all' && task.status !== filters.status) {
      return false;
    }

    // 우선순위 필터
    if (filters.priority && filters.priority !== 'all' && task.priority !== filters.priority) {
      return false;
    }

    // 담당자 필터
    if (filters.assigneeId && filters.assigneeId !== 'all' && task.assigneeId !== filters.assigneeId) {
      return false;
    }

    // 검색어 필터 (제목과 설명에서 검색)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower);
      if (!matchesSearch) {
        return false;
      }
    }

    // 태그 필터 (모든 태그가 포함되어야 함)
    if (filters.tags && filters.tags.length > 0) {
      const hasAllTags = filters.tags.every((tag) => task.tags.includes(tag));
      if (!hasAllTags) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 작업 정렬
 */
export function sortTasks(
  tasks: Task[],
  field: keyof Task,
  direction: 'asc' | 'desc' = 'asc'
): Task[] {
  return sortBy(tasks, (a, b) => {
    const aValue = a[field];
    const bValue = b[field];

    // null/undefined 처리
    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;

    // 문자열 비교
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return direction === 'asc'
        ? aValue.localeCompare(bValue, 'ko')
        : bValue.localeCompare(aValue, 'ko');
    }

    // 숫자 비교
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });
}

// ============================================
// 로컬 스토리지 유틸리티
// ============================================

/**
 * 로컬 스토리지에 안전하게 저장
 *
 * @param key - 저장 키
 * @param value - 저장할 값
 */
export function setLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

/**
 * 로컬 스토리지에서 안전하게 읽기
 *
 * @param key - 읽을 키
 * @param defaultValue - 기본값
 * @returns 저장된 값 또는 기본값
 */
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : defaultValue;
  } catch (error) {
    console.error('Failed to read from localStorage:', error);
    return defaultValue;
  }
}

/**
 * 로컬 스토리지에서 삭제
 */
export function removeLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
}

// ============================================
// 기타 유틸리티
// ============================================

/**
 * 디바운스 함수
 * 연속된 호출을 방지하고 마지막 호출만 실행
 *
 * @param fn - 실행할 함수
 * @param delay - 지연 시간 (ms)
 * @returns 디바운스된 함수
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return function debouncedFn(...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * 쓰로틀 함수
 * 일정 시간 동안 최대 한 번만 실행
 *
 * @param fn - 실행할 함수
 * @param limit - 제한 시간 (ms)
 * @returns 쓰로틀된 함수
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function throttledFn(...args: Parameters<T>) {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 랜덤 ID 생성 (간단한 버전)
 * 프로덕션에서는 UUID 라이브러리 사용 권장
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 클래스명 조합 유틸리티
 * 조건부 클래스 적용에 유용
 *
 * @param classes - 클래스명 배열 (false, null, undefined는 무시됨)
 * @returns 조합된 클래스명 문자열
 *
 * 예: cn('btn', isActive && 'active', 'btn-primary') => 'btn active btn-primary'
 */
export function cn(
  ...classes: (string | boolean | null | undefined)[]
): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * 프로미스 지연 실행 (테스트/데모용)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 학습 노트:
 *
 * 1. 순수 함수 (Pure Functions)
 *    - 동일한 입력에 항상 동일한 출력
 *    - 부작용(side effects) 없음
 *    - 예측 가능하고 테스트하기 쉬움
 *
 * 2. Generic Functions
 *    - <T>를 사용하여 타입 안전성 유지
 *    - 재사용 가능한 함수 작성
 *
 * 3. Array Immutability
 *    - [...array]로 복사 후 정렬
 *    - 원본 배열 변경 방지
 *
 * 4. TypeScript Type Guards
 *    - typeof, instanceof 활용
 *    - 타입 좁히기 (Type Narrowing)
 *
 * 5. Error Handling
 *    - try-catch로 안전하게 처리
 *    - 에러 시 기본값 반환
 *
 * 6. Higher Order Functions
 *    - debounce, throttle
 *    - 함수를 반환하는 함수
 */
