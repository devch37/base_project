/**
 * ============================================
 * 타입 정의 (Type Definitions)
 * ============================================
 *
 * 이 파일은 애플리케이션 전체에서 사용되는 TypeScript 타입과 인터페이스를 정의합니다.
 *
 * 학습 포인트:
 * 1. Interface vs Type: 언제 무엇을 사용할지
 * 2. Enum: 고정된 값의 집합 정의
 * 3. Union Types: 여러 타입 중 하나
 * 4. Optional Properties: ? 연산자
 * 5. Utility Types: Omit, Pick, Partial 등
 */

// ============================================
// Enums - 고정된 값의 집합
// ============================================

/**
 * 작업의 우선순위
 * Enum은 관련된 상수들의 집합을 정의할 때 사용합니다.
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * 작업의 상태
 * 칸반 보드의 컬럼과 매핑됩니다.
 */
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  DONE = 'done',
}

/**
 * 사용자 역할
 * 권한 관리에 사용됩니다.
 */
export enum UserRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

// ============================================
// 기본 엔티티 인터페이스
// ============================================

/**
 * 사용자 인터페이스
 *
 * interface를 사용하는 이유:
 * - 확장 가능 (extends)
 * - 선언 병합 가능
 * - 객체 구조 정의에 적합
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string; // Optional: ? 연산자 사용
  role: UserRole;
  createdAt: string; // ISO 8601 날짜 문자열
}

/**
 * 작업 인터페이스
 * 애플리케이션의 핵심 도메인 모델
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string; // 할당된 사용자 ID (선택적)
  createdBy: string; // 생성자 ID
  createdAt: string;
  updatedAt: string;
  dueDate?: string; // 마감일 (선택적)
  tags: string[]; // 배열 타입
  order: number; // 드래그 앤 드롭 순서
}

/**
 * 프로젝트 인터페이스
 */
export interface Project {
  id: string;
  name: string;
  description: string;
  color: string; // 헥스 컬러 코드
  ownerId: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 댓글 인터페이스
 */
export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// API 관련 타입
// ============================================

/**
 * API 응답을 감싸는 제네릭 타입
 *
 * Generic Type을 사용하여 재사용성을 높입니다.
 * T는 실제 데이터의 타입을 나타냅니다.
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

/**
 * 페이지네이션 메타데이터
 */
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

/**
 * 페이지네이션된 응답
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * API 에러 응답
 */
export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, unknown>; // 추가 에러 정보
}

// ============================================
// 폼 관련 타입
// ============================================

/**
 * 작업 생성 폼 데이터
 *
 * Omit 유틸리티 타입:
 * Task에서 특정 필드를 제외한 타입 생성
 */
export type CreateTaskInput = Omit<
  Task,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'order'
> & {
  // 생성 시 필요한 추가 필드가 있다면 여기에 추가
};

/**
 * 작업 수정 폼 데이터
 *
 * Partial 유틸리티 타입:
 * 모든 필드를 선택적으로 만듭니다.
 */
export type UpdateTaskInput = Partial<CreateTaskInput>;

/**
 * 로그인 폼 데이터
 */
export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * 회원가입 폼 데이터
 */
export interface RegisterInput {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

// ============================================
// 상태 관리 관련 타입
// ============================================

/**
 * 인증 상태
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * 필터 옵션
 */
export interface TaskFilters {
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  assigneeId?: string | 'all';
  search?: string;
  tags?: string[];
}

/**
 * 정렬 옵션
 */
export interface SortOption {
  field: keyof Task; // Task의 키만 허용
  direction: 'asc' | 'desc'; // Union Type: 두 값 중 하나만 가능
}

// ============================================
// UI 관련 타입
// ============================================

/**
 * 모달 상태
 */
export interface ModalState {
  isOpen: boolean;
  type: 'create' | 'edit' | 'delete' | 'detail' | null;
  data?: Task | null; // 모달에 전달될 데이터
}

/**
 * Toast 알림 타입
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * 로딩 상태
 */
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

// ============================================
// 유틸리티 타입
// ============================================

/**
 * ID 타입 (미래의 변경 가능성 대비)
 */
export type ID = string;

/**
 * Timestamp 타입
 */
export type Timestamp = string; // ISO 8601 형식

/**
 * Color 타입 (헥스 컬러)
 */
export type HexColor = `#${string}`;

/**
 * 옵션 아이템 (select, radio 등에 사용)
 */
export interface Option<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

/**
 * 테이블 컬럼 정의
 */
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

// ============================================
// 타입 가드 (Type Guards)
// ============================================

/**
 * User 타입 가드
 * 런타임에 객체가 User 타입인지 확인
 */
export function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj &&
    'name' in obj
  );
}

/**
 * Task 타입 가드
 */
export function isTask(obj: unknown): obj is Task {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'title' in obj &&
    'status' in obj
  );
}

// ============================================
// 상수
// ============================================

/**
 * 우선순위 레이블 매핑
 */
export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: '낮음',
  [TaskPriority.MEDIUM]: '보통',
  [TaskPriority.HIGH]: '높음',
  [TaskPriority.URGENT]: '긴급',
};

/**
 * 상태 레이블 매핑
 */
export const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: '할 일',
  [TaskStatus.IN_PROGRESS]: '진행 중',
  [TaskStatus.IN_REVIEW]: '검토 중',
  [TaskStatus.DONE]: '완료',
};

/**
 * 우선순위 색상
 */
export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: '#94a3b8',
  [TaskPriority.MEDIUM]: '#60a5fa',
  [TaskPriority.HIGH]: '#fb923c',
  [TaskPriority.URGENT]: '#ef4444',
};

/**
 * 학습 노트:
 *
 * 1. Interface vs Type
 *    - Interface: 객체 구조, 확장 가능, 선언 병합
 *    - Type: Union, Intersection, Utility Types
 *
 * 2. Optional Properties (?)
 *    - 필수가 아닌 속성 표시
 *    - undefined를 허용
 *
 * 3. Generic Types (<T>)
 *    - 재사용 가능한 타입 생성
 *    - ApiResponse<User>, ApiResponse<Task> 등으로 사용
 *
 * 4. Utility Types
 *    - Omit: 특정 속성 제외
 *    - Pick: 특정 속성만 선택
 *    - Partial: 모든 속성을 선택적으로
 *    - Required: 모든 속성을 필수로
 *
 * 5. Union Types (|)
 *    - 여러 타입 중 하나
 *    - 'asc' | 'desc'
 *
 * 6. Record Type
 *    - 키-값 매핑 객체
 *    - Record<string, number> = { [key: string]: number }
 *
 * 7. Type Guards
 *    - 런타임에 타입 확인
 *    - is 키워드 사용
 */
