/**
 * ============================================
 * App 컴포넌트 (애플리케이션 루트)
 * ============================================
 *
 * 애플리케이션의 최상위 컴포넌트입니다.
 *
 * 학습 포인트:
 * 1. React Query Provider 설정
 * 2. Toast Provider 설정
 * 3. 전역 상태 초기화
 * 4. 에러 바운더리
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { Button } from './components/common/Button';
import { Card } from './components/common/Card';
import { Input } from './components/common/Input';
import { useTasks, useCreateTask, useDeleteTask } from './hooks/useTasks';
import { useState } from 'react';
import type { CreateTaskInput } from './types';
import { TaskStatus, TaskPriority } from './types';

// ============================================
// React Query Client 생성
// ============================================

/**
 * QueryClient 인스턴스
 *
 * React Query의 글로벌 설정을 정의합니다.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 쿼리 기본 옵션
      retry: 1, // 실패 시 1번 재시도
      refetchOnWindowFocus: false, // 윈도우 포커스 시 리페칭 비활성화
      staleTime: 1000 * 60 * 5, // 5분간 데이터를 신선한 것으로 간주
    },
    mutations: {
      // Mutation 기본 옵션
      retry: 0, // 실패 시 재시도 안 함
    },
  },
});

// ============================================
// 메인 App 컴포넌트
// ============================================

/**
 * App 컴포넌트
 *
 * 이 컴포넌트는 학습용 데모입니다.
 * 실제 프로젝트에서는 라우터와 페이지 컴포넌트로 분리됩니다.
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Toast 알림 컨테이너 */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* 메인 컨텐츠 */}
      <div className="min-h-screen bg-gray-50">
        <DemoPage />
      </div>

      {/* React Query DevTools (개발 환경에서만 표시) */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

/**
 * 데모 페이지
 *
 * 작업 관리 기능을 시연하는 페이지입니다.
 */
function DemoPage() {
  // ========================================
  // Hooks
  // ========================================

  // 작업 목록 조회
  const { data: tasks, isLoading, error } = useTasks();

  // 작업 생성 Mutation
  const createTask = useCreateTask();

  // 작업 삭제 Mutation
  const deleteTask = useDeleteTask();

  // 로컬 상태 (폼 입력)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // ========================================
  // 이벤트 핸들러
  // ========================================

  /**
   * 작업 생성 핸들러
   */
  const handleCreateTask = () => {
    if (!title.trim()) {
      alert('제목을 입력하세요');
      return;
    }

    const newTask: CreateTaskInput = {
      title,
      description: description || '설명 없음',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      tags: [],
    };

    // Mutation 실행
    createTask.mutate(newTask, {
      onSuccess: () => {
        // 성공 시 폼 초기화
        setTitle('');
        setDescription('');
      },
    });
  };

  /**
   * 작업 삭제 핸들러
   */
  const handleDeleteTask = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteTask.mutate(id);
    }
  };

  // ========================================
  // 렌더링
  // ========================================

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 헤더 */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Task Master
        </h1>
        <p className="text-gray-600">
          React + TypeScript 학습용 작업 관리 애플리케이션
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 작업 생성 폼 */}
        <div className="lg:col-span-1">
          <Card>
            <Card.Header>
              <h2 className="text-xl font-semibold text-gray-800">
                새 작업 만들기
              </h2>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <Input
                  label="제목"
                  placeholder="작업 제목을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="작업 설명을 입력하세요"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleCreateTask}
                  isLoading={createTask.isPending}
                >
                  작업 추가
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* 학습 팁 */}
          <Card className="mt-6" padding="md">
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-800">
                학습 팁
              </h3>
            </Card.Header>
            <Card.Body>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• 개발자 도구 (F12)를 열어보세요</li>
                <li>• React DevTools로 컴포넌트 트리 확인</li>
                <li>• Network 탭에서 API 요청 확인</li>
                <li>• Console에서 로그 확인</li>
                <li>• 오른쪽 하단 React Query 아이콘 클릭</li>
              </ul>
            </Card.Body>
          </Card>
        </div>

        {/* 오른쪽: 작업 목록 */}
        <div className="lg:col-span-2">
          <Card>
            <Card.Header>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  작업 목록
                </h2>
                {tasks && (
                  <span className="text-sm text-gray-500">
                    총 {tasks.length}개
                  </span>
                )}
              </div>
            </Card.Header>
            <Card.Body>
              {/* 로딩 상태 */}
              {isLoading && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  <p className="mt-2 text-gray-600">로딩 중...</p>
                </div>
              )}

              {/* 에러 상태 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-800">
                    에러가 발생했습니다: {error.message}
                  </p>
                </div>
              )}

              {/* 작업 목록 */}
              {tasks && tasks.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    아직 작업이 없습니다. 첫 작업을 만들어보세요!
                  </p>
                </div>
              )}

              {tasks && tasks.length > 0 && (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <Card
                      key={task.id}
                      hoverable
                      className="border-l-4 border-l-blue-500"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {task.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {task.description}
                          </p>
                          <div className="flex gap-2 text-xs">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              {task.status}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                              {task.priority}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                          isLoading={deleteTask.isPending}
                        >
                          삭제
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default App;

/**
 * 학습 노트:
 *
 * 1. React Query Provider
 *    - QueryClientProvider로 앱 감싸기
 *    - queryClient 인스턴스 전달
 *    - 전역 설정 (retry, staleTime 등)
 *
 * 2. Hooks 사용
 *    - useTasks(): 데이터 페칭
 *    - useCreateTask(): 데이터 생성
 *    - useDeleteTask(): 데이터 삭제
 *
 * 3. 상태 관리 패턴
 *    - 서버 상태: React Query
 *    - UI 상태: useState
 *
 * 4. 조건부 렌더링
 *    - {isLoading && <Loading />}
 *    - {error && <Error />}
 *    - {data && <Content />}
 *
 * 5. 이벤트 처리
 *    - onClick 핸들러
 *    - onChange 핸들러
 *    - onSuccess 콜백
 *
 * 6. Toast 알림
 *    - Toaster 컴포넌트 추가
 *    - 성공/실패 자동 알림
 *
 * 7. DevTools
 *    - ReactQueryDevtools: 쿼리 상태 디버깅
 *    - 캐시 내용 확인
 *    - 쿼리 무효화 테스트
 *
 * 8. 다음 단계
 *    - 라우터 추가 (React Router)
 *    - 페이지 분리
 *    - 레이아웃 컴포넌트
 *    - 인증 구현
 *    - 드래그 앤 드롭
 */
