/**
 * ============================================================================
 * 19. 미니 프로젝트 — "할 일 관리(Task Manager) 도메인"
 * ============================================================================
 *
 * 지금까지 배운 것을 한 파일에 모았습니다:
 *   - 리터럴 유니온 / 판별 유니온            (01, 04, 10)
 *   - interface / 유틸리티 타입 (Omit, Pick) (03, 11)
 *   - 제네릭 리포지토리                        (08)
 *   - Result 패턴으로 에러 처리                (17)
 *   - 도메인 이벤트 (판별 유니온 + 완전성 검사) (10)
 *
 * 실무에서 "타입 먼저 설계하고 구현하는" 흐름을 체험하는 것이 목표입니다.
 *
 * 실행:  npx tsx src/4-practical/19-mini-project.ts
 * ============================================================================
 */

// ============================================================================
// [1] 도메인 타입 설계
// ============================================================================

type TaskStatus = 'todo' | 'in_progress' | 'done' | 'archived';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface Task {
  readonly id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assignee: string | null;
  readonly createdAt: Date;
  updatedAt: Date;
  tags: readonly string[];
}

// 생성 입력: id/시간은 시스템이 채우므로 제외, 일부는 선택값
type CreateTaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
  status?: TaskStatus;
};

// 수정 입력: 바꿀 수 있는 필드만 골라서 전부 옵셔널
type UpdateTaskInput = Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'assignee' | 'tags'>>;

// ============================================================================
// [2] Result 타입 (17번 레슨 재사용)
// ============================================================================

type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

type TaskError =
  | { kind: 'NOT_FOUND'; id: string }
  | { kind: 'VALIDATION'; messages: string[] }
  | { kind: 'ILLEGAL_TRANSITION'; from: TaskStatus; to: TaskStatus };

// ============================================================================
// [3] 상태 전이 규칙 (도메인 로직을 타입 + 데이터로 표현)
// ============================================================================

// 각 상태에서 이동 가능한 다음 상태들
const ALLOWED_TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
  todo: ['in_progress', 'archived'],
  in_progress: ['todo', 'done'],
  done: ['archived', 'in_progress'],
  archived: [], // 보관된 작업은 되돌릴 수 없음
};

function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return from === to || ALLOWED_TRANSITIONS[from].includes(to);
}

// ============================================================================
// [4] 제네릭 인메모리 리포지토리 (08번 레슨 응용)
// ============================================================================

interface Repository<T, ID> {
  findById(id: ID): T | undefined;
  findAll(): T[];
  save(entity: T): void;
  delete(id: ID): boolean;
}

class InMemoryRepository<T extends { id: ID }, ID> implements Repository<T, ID> {
  private store = new Map<ID, T>();

  findById(id: ID): T | undefined {
    return this.store.get(id);
  }
  findAll(): T[] {
    return [...this.store.values()];
  }
  save(entity: T): void {
    this.store.set(entity.id, entity);
  }
  delete(id: ID): boolean {
    return this.store.delete(id);
  }
}

// ============================================================================
// [5] 검증
// ============================================================================

function validateCreateInput(input: CreateTaskInput): string[] {
  const messages: string[] = [];
  if (!input.title || input.title.trim().length === 0) messages.push('제목은 필수입니다');
  if (input.title && input.title.length > 100) messages.push('제목은 100자 이하여야 합니다');
  const validPriorities: Priority[] = ['low', 'medium', 'high', 'urgent'];
  if (!validPriorities.includes(input.priority)) messages.push(`잘못된 우선순위: ${input.priority}`);
  return messages;
}

// ============================================================================
// [6] 서비스 계층 — 리포지토리 + 규칙 + 이벤트를 조합
// ============================================================================

// 도메인 이벤트 (판별 유니온) — 로그/알림/감사에 사용
type TaskEvent =
  | { type: 'TaskCreated'; task: Task }
  | { type: 'TaskUpdated'; taskId: string; changes: UpdateTaskInput }
  | { type: 'TaskStatusChanged'; taskId: string; from: TaskStatus; to: TaskStatus }
  | { type: 'TaskDeleted'; taskId: string };

class TaskService {
  private events: TaskEvent[] = [];
  private seq = 0;

  constructor(private repo: Repository<Task, string>) {}

  private emit(event: TaskEvent): void {
    this.events.push(event);
  }

  getEventLog(): readonly TaskEvent[] {
    return this.events;
  }

  create(input: CreateTaskInput): Result<Task, TaskError> {
    const messages = validateCreateInput(input);
    if (messages.length > 0) return err({ kind: 'VALIDATION', messages });

    const now = new Date();
    const task: Task = {
      id: `task_${++this.seq}`,
      title: input.title.trim(),
      description: input.description,
      status: input.status ?? 'todo',
      priority: input.priority,
      assignee: input.assignee,
      createdAt: now,
      updatedAt: now,
      tags: input.tags,
    };
    this.repo.save(task);
    this.emit({ type: 'TaskCreated', task });
    return ok(task);
  }

  update(id: string, changes: UpdateTaskInput): Result<Task, TaskError> {
    const existing = this.repo.findById(id);
    if (!existing) return err({ kind: 'NOT_FOUND', id });

    // 상태 변경은 전이 규칙 검사
    if (changes.status && changes.status !== existing.status) {
      if (!canTransition(existing.status, changes.status)) {
        return err({ kind: 'ILLEGAL_TRANSITION', from: existing.status, to: changes.status });
      }
      this.emit({
        type: 'TaskStatusChanged',
        taskId: id,
        from: existing.status,
        to: changes.status,
      });
    }

    const updated: Task = { ...existing, ...changes, updatedAt: new Date() };
    this.repo.save(updated);
    this.emit({ type: 'TaskUpdated', taskId: id, changes });
    return ok(updated);
  }

  delete(id: string): Result<true, TaskError> {
    const deleted = this.repo.delete(id);
    if (!deleted) return err({ kind: 'NOT_FOUND', id });
    this.emit({ type: 'TaskDeleted', taskId: id });
    return ok(true);
  }

  // 통계: 상태별 개수 (Record + 리터럴 유니온)
  stats(): Record<TaskStatus, number> {
    const result: Record<TaskStatus, number> = { todo: 0, in_progress: 0, done: 0, archived: 0 };
    for (const task of this.repo.findAll()) result[task.status]++;
    return result;
  }
}

// ============================================================================
// [7] 에러 메시지 변환 (완전성 검사 — 10번 레슨)
// ============================================================================

function formatError(error: TaskError): string {
  switch (error.kind) {
    case 'NOT_FOUND':
      return `작업을 찾을 수 없습니다 (id: ${error.id})`;
    case 'VALIDATION':
      return `검증 실패: ${error.messages.join(', ')}`;
    case 'ILLEGAL_TRANSITION':
      return `상태 전이 불가: ${error.from} → ${error.to}`;
    default: {
      const _exhaustive: never = error;
      return _exhaustive;
    }
  }
}

// ============================================================================
// [8] 실행 시나리오
// ============================================================================

console.log('--- 19. 미니 프로젝트: Task Manager ---\n');

const service = new TaskService(new InMemoryRepository<Task, string>());

// 1) 작업 생성
const created = service.create({
  title: '  TypeScript 튜토리얼 완주  ',
  description: '1단계부터 4단계까지',
  priority: 'high',
  assignee: '홍길동',
  tags: ['study', 'typescript'],
});
if (created.ok) console.log('✅ 생성:', created.value.id, '/', created.value.title);

// 2) 검증 실패 케이스
const invalid = service.create({
  title: '',
  description: '',
  priority: 'super-urgent' as Priority,
  assignee: null,
  tags: [],
});
if (!invalid.ok) console.log('❌', formatError(invalid.error));

// 3) 정상 상태 전이: todo → in_progress
const taskId = created.ok ? created.value.id : '';
const moved = service.update(taskId, { status: 'in_progress' });
if (moved.ok) console.log('✅ 상태 변경:', moved.value.status);

// 4) 잘못된 상태 전이: in_progress → archived (규칙상 불가)
const illegal = service.update(taskId, { status: 'archived' });
if (!illegal.ok) console.log('❌', formatError(illegal.error));

// 5) 완료 처리
service.update(taskId, { status: 'done', assignee: '홍길동' });

// 6) 없는 작업 수정
const missing = service.update('task_999', { title: 'x' });
if (!missing.ok) console.log('❌', formatError(missing.error));

// 7) 두 번째 작업 추가 후 통계
service.create({
  title: '코드 리뷰',
  description: 'PR #42',
  priority: 'medium',
  assignee: null,
  tags: ['review'],
});

console.log('\n📊 상태별 통계:', service.stats());

console.log('\n📜 이벤트 로그:');
for (const event of service.getEventLog()) {
  console.log('  -', event.type);
}

export {};
