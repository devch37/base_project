/**
 * ============================================
 * 작업 상태 관리 (Task Store)
 * ============================================
 *
 * 작업 관련 클라이언트 상태를 관리합니다.
 * (서버 상태는 React Query로 관리)
 *
 * 학습 포인트:
 * 1. UI 상태와 서버 상태 분리
 * 2. 복잡한 상태 업데이트 로직
 * 3. 상태 슬라이스 패턴
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { TaskFilters, SortOption, TaskStatus, TaskPriority, Task } from '../types';

// ============================================
// 타입 정의
// ============================================

/**
 * 모달 타입
 */
type ModalType = 'create' | 'edit' | 'delete' | 'detail' | null;

/**
 * 뷰 타입
 */
type ViewType = 'list' | 'board' | 'calendar';

/**
 * 작업 상태 인터페이스
 */
interface TaskState {
  // ========================================
  // UI 상태
  // ========================================

  // 현재 뷰 타입
  viewType: ViewType;

  // 필터
  filters: TaskFilters;

  // 정렬
  sortOption: SortOption;

  // 검색어
  searchQuery: string;

  // 선택된 작업 ID들
  selectedTaskIds: string[];

  // 모달 상태
  modal: {
    isOpen: boolean;
    type: ModalType;
    taskId?: string;
  };

  // 사이드바 열림 상태
  isSidebarOpen: boolean;

  // ========================================
  // 액션
  // ========================================

  // 뷰 변경
  setViewType: (viewType: ViewType) => void;

  // 필터 설정
  setFilters: (filters: Partial<TaskFilters>) => void;
  resetFilters: () => void;

  // 정렬 설정
  setSortOption: (sortOption: SortOption) => void;

  // 검색
  setSearchQuery: (query: string) => void;

  // 작업 선택
  selectTask: (taskId: string) => void;
  deselectTask: (taskId: string) => void;
  toggleTaskSelection: (taskId: string) => void;
  selectAllTasks: (taskIds: string[]) => void;
  clearSelection: () => void;

  // 모달
  openModal: (type: ModalType, taskId?: string) => void;
  closeModal: () => void;

  // 사이드바
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
}

// ============================================
// 초기 상태
// ============================================

const initialFilters: TaskFilters = {
  status: 'all',
  priority: 'all',
  assigneeId: 'all',
  search: '',
  tags: [],
};

const initialSortOption: SortOption = {
  field: 'createdAt',
  direction: 'desc',
};

// ============================================
// Store 생성
// ============================================

/**
 * 작업 상태 스토어
 *
 * devtools 미들웨어 사용:
 * - Redux DevTools로 상태 디버깅 가능
 * - 타임 트래블 디버깅
 */
export const useTaskStore = create<TaskState>()(
  devtools(
    (set) => ({
      // ========================================
      // 초기 상태
      // ========================================

      viewType: 'board',
      filters: initialFilters,
      sortOption: initialSortOption,
      searchQuery: '',
      selectedTaskIds: [],
      modal: {
        isOpen: false,
        type: null,
      },
      isSidebarOpen: true,

      // ========================================
      // 액션
      // ========================================

      setViewType: (viewType) =>
        set(
          { viewType },
          false,
          'taskStore/setViewType' // DevTools 액션 이름
        ),

      setFilters: (newFilters) =>
        set(
          (state) => ({
            filters: {
              ...state.filters,
              ...newFilters,
            },
          }),
          false,
          'taskStore/setFilters'
        ),

      resetFilters: () =>
        set(
          { filters: initialFilters },
          false,
          'taskStore/resetFilters'
        ),

      setSortOption: (sortOption) =>
        set(
          { sortOption },
          false,
          'taskStore/setSortOption'
        ),

      setSearchQuery: (searchQuery) =>
        set(
          (state) => ({
            searchQuery,
            filters: {
              ...state.filters,
              search: searchQuery,
            },
          }),
          false,
          'taskStore/setSearchQuery'
        ),

      selectTask: (taskId) =>
        set(
          (state) => ({
            selectedTaskIds: state.selectedTaskIds.includes(taskId)
              ? state.selectedTaskIds
              : [...state.selectedTaskIds, taskId],
          }),
          false,
          'taskStore/selectTask'
        ),

      deselectTask: (taskId) =>
        set(
          (state) => ({
            selectedTaskIds: state.selectedTaskIds.filter((id) => id !== taskId),
          }),
          false,
          'taskStore/deselectTask'
        ),

      toggleTaskSelection: (taskId) =>
        set(
          (state) => ({
            selectedTaskIds: state.selectedTaskIds.includes(taskId)
              ? state.selectedTaskIds.filter((id) => id !== taskId)
              : [...state.selectedTaskIds, taskId],
          }),
          false,
          'taskStore/toggleTaskSelection'
        ),

      selectAllTasks: (taskIds) =>
        set(
          { selectedTaskIds: taskIds },
          false,
          'taskStore/selectAllTasks'
        ),

      clearSelection: () =>
        set(
          { selectedTaskIds: [] },
          false,
          'taskStore/clearSelection'
        ),

      openModal: (type, taskId) =>
        set(
          {
            modal: {
              isOpen: true,
              type,
              taskId,
            },
          },
          false,
          'taskStore/openModal'
        ),

      closeModal: () =>
        set(
          {
            modal: {
              isOpen: false,
              type: null,
              taskId: undefined,
            },
          },
          false,
          'taskStore/closeModal'
        ),

      toggleSidebar: () =>
        set(
          (state) => ({ isSidebarOpen: !state.isSidebarOpen }),
          false,
          'taskStore/toggleSidebar'
        ),

      setSidebarOpen: (isOpen) =>
        set(
          { isSidebarOpen: isOpen },
          false,
          'taskStore/setSidebarOpen'
        ),
    }),
    {
      name: 'TaskStore', // DevTools에 표시될 이름
    }
  )
);

// ============================================
// Selectors
// ============================================

/**
 * 활성 필터 개수 계산
 */
export const selectActiveFilterCount = (state: TaskState): number => {
  let count = 0;

  if (state.filters.status && state.filters.status !== 'all') count++;
  if (state.filters.priority && state.filters.priority !== 'all') count++;
  if (state.filters.assigneeId && state.filters.assigneeId !== 'all') count++;
  if (state.filters.tags && state.filters.tags.length > 0) count++;
  if (state.filters.search && state.filters.search.trim()) count++;

  return count;
};

/**
 * 선택된 작업 개수
 */
export const selectSelectedCount = (state: TaskState): number => {
  return state.selectedTaskIds.length;
};

/**
 * 특정 작업이 선택되었는지 확인
 */
export const selectIsTaskSelected = (taskId: string) => (state: TaskState): boolean => {
  return state.selectedTaskIds.includes(taskId);
};

/**
 * 현재 필터
 */
export const selectFilters = (state: TaskState) => state.filters;

/**
 * 현재 정렬 옵션
 */
export const selectSortOption = (state: TaskState) => state.sortOption;

/**
 * 모달 상태
 */
export const selectModal = (state: TaskState) => state.modal;

// ============================================
// 커스텀 Hook
// ============================================

/**
 * 필터링된 작업 가져오기
 *
 * 이 Hook은 서버 상태(React Query)와 클라이언트 상태(Zustand)를 결합합니다.
 * 실제 구현은 컴포넌트에서 useQuery와 함께 사용됩니다.
 */
export function useFilteredTasks(tasks: Task[]): Task[] {
  const filters = useTaskStore(selectFilters);
  const sortOption = useTaskStore(selectSortOption);

  // 필터링
  let filtered = tasks.filter((task) => {
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

    // 검색 필터
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower);
      if (!matchesSearch) {
        return false;
      }
    }

    // 태그 필터
    if (filters.tags && filters.tags.length > 0) {
      const hasAllTags = filters.tags.every((tag) => task.tags.includes(tag));
      if (!hasAllTags) {
        return false;
      }
    }

    return true;
  });

  // 정렬
  filtered = [...filtered].sort((a, b) => {
    const aValue = a[sortOption.field];
    const bValue = b[sortOption.field];

    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOption.direction === 'asc'
        ? aValue.localeCompare(bValue, 'ko')
        : bValue.localeCompare(aValue, 'ko');
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOption.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  return filtered;
}

/**
 * 학습 노트:
 *
 * 1. UI 상태 vs 서버 상태
 *    - UI 상태: 필터, 정렬, 선택, 모달 → Zustand
 *    - 서버 상태: 작업 데이터 → React Query
 *    - 명확한 책임 분리
 *
 * 2. DevTools 미들웨어
 *    - Redux DevTools 확장 프로그램 사용
 *    - 상태 변화 추적 및 디버깅
 *    - 타임 트래블 가능
 *
 * 3. 액션 이름 지정
 *    - set() 세 번째 인자로 액션 이름
 *    - DevTools에서 쉽게 추적
 *
 * 4. 셀렉터 패턴
 *    - 복잡한 로직을 셀렉터로 분리
 *    - 컴포넌트 코드 간결화
 *    - 재사용성 향상
 *
 * 5. 커스텀 Hook
 *    - useFilteredTasks: 필터링 로직 캡슐화
 *    - 여러 컴포넌트에서 재사용
 *
 * 6. 불변성 유지
 *    - 배열: [...array, newItem]
 *    - 객체: { ...object, newProp }
 *    - filter, map 활용
 *
 * 7. 복잡한 상태 업데이트
 *    - 이전 상태를 기반으로 업데이트
 *    - set((state) => ({ ... }))
 */
