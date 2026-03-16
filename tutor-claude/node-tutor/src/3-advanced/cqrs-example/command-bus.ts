/**
 * ============================================
 * CQRS Pattern - Command/Query Bus 구현
 * ============================================
 *
 * CQRS (Command Query Responsibility Segregation)란?
 * - 명령(Command, 쓰기)과 조회(Query, 읽기)를 분리하는 패턴
 *
 * 일반 아키텍처:           CQRS 아키텍처:
 * Controller               Controller
 *     ↓                   ↙         ↘
 *  Service           CommandBus   QueryBus
 *     ↓                  ↓            ↓
 * Repository       CommandHandler  QueryHandler
 *                       ↓            ↓
 *                    Write DB     Read DB (별도 가능)
 *
 * 장점:
 * - 읽기와 쓰기 최적화 분리
 * - 단일 책임 원칙 강화
 * - 확장성 (읽기 DB와 쓰기 DB 분리 가능)
 * - 이벤트 소싱과 자연스럽게 결합
 *
 * 단점:
 * - 복잡성 증가
 * - 단순한 CRUD에는 과도한 설계
 *
 * 실무에서는 @nestjs/cqrs 패키지 사용:
 * npm install @nestjs/cqrs
 *
 * 이 파일은 핵심 개념 이해를 위한 직접 구현입니다.
 */

import { Injectable } from '@nestjs/common';

/**
 * Command 인터페이스
 * - 시스템의 상태를 변경하는 요청
 * - 반드시 핸들러가 있어야 함
 */
export interface ICommand {
  readonly commandName: string;
}

/**
 * Query 인터페이스
 * - 데이터를 조회하는 요청
 * - 상태 변경 없음
 */
export interface IQuery {
  readonly queryName: string;
}

/**
 * Command Handler 인터페이스
 */
export interface ICommandHandler<TCommand extends ICommand, TResult = void> {
  execute(command: TCommand): Promise<TResult>;
}

/**
 * Query Handler 인터페이스
 */
export interface IQueryHandler<TQuery extends IQuery, TResult> {
  execute(query: TQuery): Promise<TResult>;
}

/**
 * CommandBus
 * ===========
 * Command를 등록된 Handler에게 전달
 *
 * @nestjs/cqrs의 CommandBus와 동일한 개념
 */
@Injectable()
export class CommandBus {
  private handlers = new Map<string, ICommandHandler<any, any>>();

  /**
   * Handler 등록
   */
  register<T extends ICommand>(commandName: string, handler: ICommandHandler<T, any>): void {
    this.handlers.set(commandName, handler);
    console.log(`[CommandBus] Handler 등록: ${commandName}`);
  }

  /**
   * Command 실행
   * - commandName으로 핸들러 찾아 실행
   */
  async execute<TResult = void>(command: ICommand): Promise<TResult> {
    const handler = this.handlers.get(command.commandName);

    if (!handler) {
      throw new Error(`Command Handler not found: ${command.commandName}`);
    }

    console.log(`[CommandBus] Command 실행: ${command.commandName}`);
    return handler.execute(command);
  }
}

/**
 * QueryBus
 * =========
 * Query를 등록된 Handler에게 전달
 */
@Injectable()
export class QueryBus {
  private handlers = new Map<string, IQueryHandler<any, any>>();

  register<T extends IQuery>(queryName: string, handler: IQueryHandler<T, any>): void {
    this.handlers.set(queryName, handler);
    console.log(`[QueryBus] Handler 등록: ${queryName}`);
  }

  async execute<TResult>(query: IQuery): Promise<TResult> {
    const handler = this.handlers.get(query.queryName);

    if (!handler) {
      throw new Error(`Query Handler not found: ${query.queryName}`);
    }

    console.log(`[QueryBus] Query 실행: ${query.queryName}`);
    return handler.execute(query);
  }
}

/**
 * @nestjs/cqrs 실무 사용 방법
 * ============================
 *
 * 1. 패키지 설치:
 *    npm install @nestjs/cqrs
 *
 * 2. CqrsModule 등록:
 *    @Module({
 *      imports: [CqrsModule],
 *      providers: [CreatePostHandler, GetPostHandler],
 *    })
 *
 * 3. Command 정의:
 *    export class CreatePostCommand implements ICommand {
 *      constructor(public readonly title: string) {}
 *    }
 *
 * 4. Handler 정의:
 *    @CommandHandler(CreatePostCommand)
 *    export class CreatePostHandler implements ICommandHandler<CreatePostCommand> {
 *      async execute(command: CreatePostCommand) {
 *        // ...
 *      }
 *    }
 *
 * 5. Controller에서 사용:
 *    constructor(private commandBus: CommandBus) {}
 *
 *    @Post()
 *    async create(@Body() dto: CreatePostDto) {
 *      return this.commandBus.execute(new CreatePostCommand(dto.title));
 *    }
 */
