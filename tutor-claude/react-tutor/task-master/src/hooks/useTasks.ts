/**
 * ============================================
 * 작업 관련 Custom Hook
 * ============================================
 *
 * React Query를 사용하여 작업 데이터를 관리하는 Hook입니다.
 *
 * 학습 포인트:
 * 1. React Query 기본 사용법
 * 2. useQuery로 데이터 페칭
 * 3. useMutation으로 데이터 변경
 * 4. 캐시 무효화 (Invalidation)
 * 5. 낙관적 업데이트 (Optimistic Updates)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../types';
import mockApi from '../services/mockApi';
import { getErrorMessage } from '../services/api';

// ============================================
// Query Keys
// ============================================

/**
 * Query Key 상수
 *
 * React Query는 Query Key로 캐시를 관리합니다.
 * 중앙화된 Key 관리로 일관성을 유지합니다.
 */
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters?: unknown) => [...taskKeys.lists(), { filters }] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

// ============================================
// useQuery Hooks
// ============================================

/**
 * 모든 작업 조회
 *
 * useQuery의 기본 구조:
 * - queryKey: 캐시 키 (배열)
 * - queryFn: 데이터를 가져오는 함수
 * - 옵션: staleTime, cacheTime 등
 *
 * @returns Query 결과 객체 { data, isLoading, error, ... }
 */
export function useTasks() {
  return useQuery({
    queryKey: taskKeys.lists(),
    queryFn: async () => {
      const response = await mockApi.task.getTasks();
      return response.data;
    },
    // 데이터가 신선한 것으로 간주되는 시간 (5분)
    staleTime: 1000 * 60 * 5,
    // 캐시에 데이터를 보관하는 시간 (10분)
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * 특정 작업 조회
 *
 * @param id - 작업 ID
 * @param enabled - 쿼리 활성화 여부 (선택적)
 */
export function useTask(id: string, enabled = true) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: async () => {
      const response = await mockApi.task.getTask(id);
      return response.data;
    },
    // id가 있을 때만 쿼리 실행
    enabled: Boolean(id) && enabled,
    staleTime: 1000 * 60 * 5,
  });
}

// ============================================
// useMutation Hooks
// ============================================

/**
 * 작업 생성 Mutation
 *
 * useMutation의 구조:
 * - mutationFn: API 호출 함수
 * - onSuccess: 성공 시 콜백
 * - onError: 실패 시 콜백
 * - onMutate: Mutation 시작 시 콜백 (낙관적 업데이트용)
 *
 * @returns Mutation 객체 { mutate, mutateAsync, isLoading, ... }
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTaskInput) => {
      const response = await mockApi.task.createTask(data);
      return response.data;
    },

    /**
     * 성공 시 캐시 무효화
     *
     * invalidateQueries: 해당 쿼리를 다시 fetch하도록 표시
     * 컴포넌트가 자동으로 리렌더링됩니다.
     */
    onSuccess: (newTask) => {
      // 작업 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: taskKeys.lists(),
      });

      // 성공 토스트
      toast.success('작업이 생성되었습니다.');

      console.log('Created task:', newTask);
    },

    /**
     * 실패 시 에러 처리
     */
    onError: (error) => {
      const message = getErrorMessage(error);
      toast.error(`작업 생성 실패: ${message}`);
      console.error('Create task error:', error);
    },
  });
}

/**
 * 작업 수정 Mutation
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskInput }) => {
      const response = await mockApi.task.updateTask(id, data);
      return response.data;
    },

    /**
     * 낙관적 업데이트 (Optimistic Update)
     *
     * API 응답을 기다리지 않고 즉시 UI를 업데이트합니다.
     * 더 빠른 사용자 경험을 제공합니다.
     */
    onMutate: async ({ id, data }) => {
      // 진행 중인 쿼리 취소 (충돌 방지)
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) });

      // 이전 데이터 백업 (롤백용)
      const previousTask = queryClient.getQueryData<Task>(taskKeys.detail(id));

      // 낙관적으로 캐시 업데이트
      if (previousTask) {
        queryClient.setQueryData<Task>(taskKeys.detail(id), {
          ...previousTask,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }

      // 롤백을 위한 컨텍스트 반환
      return { previousTask };
    },

    /**
     * 성공 시
     */
    onSuccess: (updatedTask) => {
      // 작업 상세 캐시 업데이트
      queryClient.setQueryData<Task>(taskKeys.detail(updatedTask.id), updatedTask);

      // 작업 목록 무효화
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });

      toast.success('작업이 수정되었습니다.');
    },

    /**
     * 실패 시 롤백
     */
    onError: (error, { id }, context) => {
      // 이전 데이터로 롤백
      if (context?.previousTask) {
        queryClient.setQueryData<Task>(taskKeys.detail(id), context.previousTask);
      }

      const message = getErrorMessage(error);
      toast.error(`작업 수정 실패: ${message}`);
      console.error('Update task error:', error);
    },

    /**
     * 완료 시 (성공/실패 무관)
     */
    onSettled: (updatedTask) => {
      if (updatedTask) {
        // 최신 데이터로 갱신
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(updatedTask.id) });
      }
    },
  });
}

/**
 * 작업 삭제 Mutation
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await mockApi.task.deleteTask(id);
      return id;
    },

    /**
     * 낙관적 업데이트
     */
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.lists());

      // 목록에서 즉시 제거
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          taskKeys.lists(),
          previousTasks.filter((task) => task.id !== id)
        );
      }

      return { previousTasks };
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success('작업이 삭제되었습니다.');
    },

    onError: (error, id, context) => {
      // 롤백
      if (context?.previousTasks) {
        queryClient.setQueryData<Task[]>(taskKeys.lists(), context.previousTasks);
      }

      const message = getErrorMessage(error);
      toast.error(`작업 삭제 실패: ${message}`);
      console.error('Delete task error:', error);
    },
  });
}

/**
 * 작업 순서 변경 Mutation (드래그 앤 드롭용)
 */
export function useReorderTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      newOrder,
      newStatus,
    }: {
      id: string;
      newOrder: number;
      newStatus?: string;
    }) => {
      const response = await mockApi.task.reorderTask(id, newOrder, newStatus as any);
      return response.data;
    },

    /**
     * 드래그 앤 드롭은 즉각적인 피드백이 중요하므로
     * 낙관적 업데이트를 사용합니다.
     */
    onMutate: async ({ id, newOrder, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.lists());

      if (previousTasks) {
        const updatedTasks = previousTasks.map((task) =>
          task.id === id
            ? {
                ...task,
                order: newOrder,
                ...(newStatus && { status: newStatus as any }),
                updatedAt: new Date().toISOString(),
              }
            : task
        );

        queryClient.setQueryData<Task[]>(taskKeys.lists(), updatedTasks);
      }

      return { previousTasks };
    },

    onError: (error, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData<Task[]>(taskKeys.lists(), context.previousTasks);
      }

      const message = getErrorMessage(error);
      toast.error(`순서 변경 실패: ${message}`);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

// ============================================
// 헬퍼 Hook
// ============================================

/**
 * 여러 Mutation을 조합한 Hook
 *
 * 모든 작업 관련 Mutation을 한 번에 제공합니다.
 */
export function useTaskMutations() {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const reorderTask = useReorderTask();

  return {
    createTask,
    updateTask,
    deleteTask,
    reorderTask,
    // 로딩 상태 통합
    isLoading:
      createTask.isPending ||
      updateTask.isPending ||
      deleteTask.isPending ||
      reorderTask.isPending,
  };
}

/**
 * 학습 노트:
 *
 * 1. React Query 핵심 개념
 *    - Query: 데이터 읽기 (GET)
 *    - Mutation: 데이터 변경 (POST, PUT, DELETE)
 *    - Query Key: 캐시 식별자
 *
 * 2. useQuery
 *    - queryKey: 고유 키 (배열)
 *    - queryFn: Promise 반환 함수
 *    - 자동 캐싱, 리페칭, 백그라운드 업데이트
 *
 * 3. useMutation
 *    - mutationFn: API 호출 함수
 *    - onMutate: 낙관적 업데이트
 *    - onSuccess/onError: 결과 처리
 *
 * 4. 캐시 무효화
 *    - invalidateQueries: 쿼리를 stale로 표시하고 리페칭
 *    - 데이터 일관성 유지
 *
 * 5. 낙관적 업데이트
 *    - API 응답 전에 UI 업데이트
 *    - 빠른 사용자 경험
 *    - 실패 시 롤백
 *
 * 6. Query Key 패턴
 *    - 계층적 구조: ['tasks', 'list', { filters }]
 *    - 부분 무효화 가능
 *
 * 7. 에러 처리
 *    - onError 콜백
 *    - toast로 사용자 피드백
 *    - 콘솔 로깅
 *
 * 8. 컴포넌트에서 사용
 *    ```tsx
 *    const { data: tasks, isLoading, error } = useTasks();
 *    const createTask = useCreateTask();
 *
 *    const handleCreate = () => {
 *      createTask.mutate({ title: '...', ... });
 *    };
 *    ```
 */
