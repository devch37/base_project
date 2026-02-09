/**
 * ============================================
 * Mock API (개발/학습용)
 * ============================================
 *
 * 실제 백엔드 없이 프론트엔드를 개발하고 학습할 수 있도록
 * Mock API를 제공합니다.
 *
 * 학습 포인트:
 * 1. 로컬 스토리지로 데이터 영속성 구현
 * 2. Promise 기반 비동기 처리
 * 3. 실제 API와 동일한 인터페이스
 * 4. 에러 시뮬레이션
 */

import {
  Task,
  User,
  TaskStatus,
  TaskPriority,
  UserRole,
  CreateTaskInput,
  UpdateTaskInput,
  LoginInput,
  RegisterInput,
  ApiResponse,
  ApiError,
} from '../types';
import { delay, generateId } from '../utils/helpers';

// ============================================
// Mock 데이터 저장소
// ============================================

const STORAGE_KEYS = {
  TASKS: 'mock_tasks',
  USERS: 'mock_users',
  CURRENT_USER: 'mock_current_user',
  AUTH_TOKEN: 'mock_auth_token',
} as const;

// ============================================
// 초기 Mock 데이터
// ============================================

const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'admin@taskmaster.com',
    name: '관리자',
    role: UserRole.ADMIN,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'user@taskmaster.com',
    name: '일반 사용자',
    role: UserRole.MEMBER,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
    createdAt: new Date().toISOString(),
  },
];

const MOCK_TASKS: Task[] = [
  {
    id: '1',
    title: 'React 기초 학습',
    description: 'React 공식 문서를 읽고 기본 개념을 이해합니다.',
    status: TaskStatus.DONE,
    priority: TaskPriority.HIGH,
    assigneeId: '1',
    createdBy: '1',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['학습', 'React'],
    order: 0,
  },
  {
    id: '2',
    title: 'TypeScript 타입 시스템 마스터하기',
    description: 'Interface, Type, Generic 등 TypeScript의 타입 시스템을 깊이 있게 학습합니다.',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    assigneeId: '1',
    createdBy: '1',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['학습', 'TypeScript'],
    order: 0,
  },
  {
    id: '3',
    title: 'API 통신 구현',
    description: 'Axios와 React Query를 사용하여 서버와 통신하는 코드를 작성합니다.',
    status: TaskStatus.IN_REVIEW,
    priority: TaskPriority.HIGH,
    assigneeId: '2',
    createdBy: '1',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['개발', 'API'],
    order: 0,
  },
  {
    id: '4',
    title: '드래그 앤 드롭 기능 추가',
    description: 'dnd-kit을 사용하여 작업 카드를 드래그 앤 드롭할 수 있게 합니다.',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    createdBy: '1',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['개발', 'UI'],
    order: 0,
  },
  {
    id: '5',
    title: '성능 최적화',
    description: 'React.memo, useMemo, useCallback을 활용하여 불필요한 리렌더링을 방지합니다.',
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    assigneeId: '2',
    createdBy: '2',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['개발', '최적화'],
    order: 1,
  },
];

// ============================================
// 로컬 스토리지 헬퍼
// ============================================

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

// ============================================
// 데이터 초기화
// ============================================

function initializeMockData(): void {
  // 데이터가 없으면 초기 데이터 저장
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    saveToStorage(STORAGE_KEYS.USERS, MOCK_USERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
    saveToStorage(STORAGE_KEYS.TASKS, MOCK_TASKS);
  }
}

// 앱 시작 시 초기화
initializeMockData();

// ============================================
// Mock Auth API
// ============================================

export const mockAuthApi = {
  /**
   * 로그인 시뮬레이션
   */
  login: async (credentials: LoginInput): Promise<ApiResponse<{ user: User; token: string }>> => {
    await delay(800); // 네트워크 지연 시뮬레이션

    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, MOCK_USERS);
    const user = users.find((u) => u.email === credentials.email);

    // 간단한 인증 체크 (실제로는 비밀번호를 서버에서 검증)
    // 데모용으로 어떤 비밀번호든 허용
    if (!user) {
      const error: ApiError = {
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
        code: 'INVALID_CREDENTIALS',
      };
      throw error;
    }

    const token = `mock_token_${user.id}_${Date.now()}`;

    // 로그인 정보 저장
    saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
    saveToStorage(STORAGE_KEYS.AUTH_TOKEN, token);

    return {
      data: { user, token },
      success: true,
      message: '로그인 성공',
    };
  },

  /**
   * 회원가입 시뮬레이션
   */
  register: async (data: RegisterInput): Promise<ApiResponse<{ user: User; token: string }>> => {
    await delay(1000);

    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, MOCK_USERS);

    // 이메일 중복 체크
    if (users.some((u) => u.email === data.email)) {
      const error: ApiError = {
        message: '이미 사용 중인 이메일입니다.',
        code: 'EMAIL_EXISTS',
      };
      throw error;
    }

    // 비밀번호 확인
    if (data.password !== data.confirmPassword) {
      const error: ApiError = {
        message: '비밀번호가 일치하지 않습니다.',
        code: 'PASSWORD_MISMATCH',
      };
      throw error;
    }

    // 새 사용자 생성
    const newUser: User = {
      id: generateId(),
      email: data.email,
      name: data.name,
      role: UserRole.MEMBER,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
      createdAt: new Date().toISOString(),
    };

    const token = `mock_token_${newUser.id}_${Date.now()}`;

    // 저장
    users.push(newUser);
    saveToStorage(STORAGE_KEYS.USERS, users);
    saveToStorage(STORAGE_KEYS.CURRENT_USER, newUser);
    saveToStorage(STORAGE_KEYS.AUTH_TOKEN, token);

    return {
      data: { user: newUser, token },
      success: true,
      message: '회원가입 성공',
    };
  },

  /**
   * 로그아웃
   */
  logout: async (): Promise<ApiResponse<null>> => {
    await delay(300);

    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);

    return {
      data: null,
      success: true,
      message: '로그아웃되었습니다.',
    };
  },

  /**
   * 현재 사용자 정보 조회
   */
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    await delay(500);

    const user = getFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);

    if (!user) {
      const error: ApiError = {
        message: '인증되지 않은 사용자입니다.',
        code: 'UNAUTHORIZED',
      };
      throw error;
    }

    return {
      data: user,
      success: true,
    };
  },
};

// ============================================
// Mock Task API
// ============================================

export const mockTaskApi = {
  /**
   * 모든 작업 조회
   */
  getTasks: async (): Promise<ApiResponse<Task[]>> => {
    await delay(600);

    const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, MOCK_TASKS);

    return {
      data: tasks,
      success: true,
    };
  },

  /**
   * 특정 작업 조회
   */
  getTask: async (id: string): Promise<ApiResponse<Task>> => {
    await delay(400);

    const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, MOCK_TASKS);
    const task = tasks.find((t) => t.id === id);

    if (!task) {
      const error: ApiError = {
        message: '작업을 찾을 수 없습니다.',
        code: 'TASK_NOT_FOUND',
      };
      throw error;
    }

    return {
      data: task,
      success: true,
    };
  },

  /**
   * 작업 생성
   */
  createTask: async (data: CreateTaskInput): Promise<ApiResponse<Task>> => {
    await delay(700);

    const currentUser = getFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);

    if (!currentUser) {
      const error: ApiError = {
        message: '로그인이 필요합니다.',
        code: 'UNAUTHORIZED',
      };
      throw error;
    }

    const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, MOCK_TASKS);

    const newTask: Task = {
      ...data,
      id: generateId(),
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: tasks.filter((t) => t.status === data.status).length,
    };

    tasks.push(newTask);
    saveToStorage(STORAGE_KEYS.TASKS, tasks);

    return {
      data: newTask,
      success: true,
      message: '작업이 생성되었습니다.',
    };
  },

  /**
   * 작업 수정
   */
  updateTask: async (id: string, data: UpdateTaskInput): Promise<ApiResponse<Task>> => {
    await delay(600);

    const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, MOCK_TASKS);
    const taskIndex = tasks.findIndex((t) => t.id === id);

    if (taskIndex === -1) {
      const error: ApiError = {
        message: '작업을 찾을 수 없습니다.',
        code: 'TASK_NOT_FOUND',
      };
      throw error;
    }

    const updatedTask: Task = {
      ...tasks[taskIndex],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    tasks[taskIndex] = updatedTask;
    saveToStorage(STORAGE_KEYS.TASKS, tasks);

    return {
      data: updatedTask,
      success: true,
      message: '작업이 수정되었습니다.',
    };
  },

  /**
   * 작업 삭제
   */
  deleteTask: async (id: string): Promise<ApiResponse<null>> => {
    await delay(500);

    const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, MOCK_TASKS);
    const filteredTasks = tasks.filter((t) => t.id !== id);

    if (tasks.length === filteredTasks.length) {
      const error: ApiError = {
        message: '작업을 찾을 수 없습니다.',
        code: 'TASK_NOT_FOUND',
      };
      throw error;
    }

    saveToStorage(STORAGE_KEYS.TASKS, filteredTasks);

    return {
      data: null,
      success: true,
      message: '작업이 삭제되었습니다.',
    };
  },

  /**
   * 작업 순서 변경
   */
  reorderTask: async (
    id: string,
    newOrder: number,
    newStatus?: TaskStatus
  ): Promise<ApiResponse<Task>> => {
    await delay(400);

    const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, MOCK_TASKS);
    const taskIndex = tasks.findIndex((t) => t.id === id);

    if (taskIndex === -1) {
      const error: ApiError = {
        message: '작업을 찾을 수 없습니다.',
        code: 'TASK_NOT_FOUND',
      };
      throw error;
    }

    const updatedTask: Task = {
      ...tasks[taskIndex],
      order: newOrder,
      ...(newStatus && { status: newStatus }),
      updatedAt: new Date().toISOString(),
    };

    tasks[taskIndex] = updatedTask;
    saveToStorage(STORAGE_KEYS.TASKS, tasks);

    return {
      data: updatedTask,
      success: true,
    };
  },
};

// ============================================
// Mock User API
// ============================================

export const mockUserApi = {
  /**
   * 모든 사용자 조회
   */
  getUsers: async (): Promise<ApiResponse<User[]>> => {
    await delay(500);

    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, MOCK_USERS);

    return {
      data: users,
      success: true,
    };
  },

  /**
   * 특정 사용자 조회
   */
  getUser: async (id: string): Promise<ApiResponse<User>> => {
    await delay(400);

    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, MOCK_USERS);
    const user = users.find((u) => u.id === id);

    if (!user) {
      const error: ApiError = {
        message: '사용자를 찾을 수 없습니다.',
        code: 'USER_NOT_FOUND',
      };
      throw error;
    }

    return {
      data: user,
      success: true,
    };
  },
};

// ============================================
// Export
// ============================================

export default {
  auth: mockAuthApi,
  task: mockTaskApi,
  user: mockUserApi,
};

/**
 * 학습 노트:
 *
 * 1. Mock API의 목적
 *    - 백엔드 없이 프론트엔드 개발
 *    - 실제 API와 동일한 인터페이스
 *    - 빠른 프로토타이핑
 *
 * 2. 로컬 스토리지 활용
 *    - 새로고침 후에도 데이터 유지
 *    - 영속성 제공
 *
 * 3. 비동기 처리
 *    - delay() 함수로 네트워크 지연 시뮬레이션
 *    - 실제 API와 유사한 사용자 경험
 *
 * 4. 에러 시뮬레이션
 *    - 다양한 에러 케이스 테스트 가능
 *    - ApiError 타입 사용
 *
 * 5. 실제 API로 전환
 *    - Mock API에서 실제 API로 쉽게 전환 가능
 *    - 인터페이스가 동일하므로 코드 변경 최소화
 */
