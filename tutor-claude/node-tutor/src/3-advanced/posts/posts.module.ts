/**
 * ============================================
 * Posts Module - 3-advanced
 * ============================================
 *
 * 모든 계층을 하나의 모듈로 묶기:
 * - Presentation: PostsController
 * - Application: Use Cases
 * - Domain: PostDomainService
 * - Infrastructure: Repository 구현체
 *
 * DI 토큰으로 Repository 바인딩:
 * { provide: POST_REPOSITORY, useClass: PostInMemoryRepository }
 * → IPostRepository 인터페이스를 요청하면 PostInMemoryRepository 주입
 * → 실무에서 DB 교체 시 useClass만 바꾸면 됨!
 */

import { Module } from '@nestjs/common';
import { PostsController } from '../presentation/controllers/posts.controller';
import { CreatePostUseCase } from '../application/use-cases/create-post/create-post.use-case';
import { GetPostUseCase } from '../application/use-cases/get-post/get-post.use-case';
import { ListPostsUseCase } from '../application/use-cases/list-posts/list-posts.use-case';
import { UpdatePostUseCase } from '../application/use-cases/update-post/update-post.use-case';
import { DeletePostUseCase } from '../application/use-cases/delete-post/delete-post.use-case';
import { PostDomainService } from '../domain/services/post.domain-service';
import { PostInMemoryRepository } from '../infrastructure/repositories/post.in-memory.repository';
import { POST_REPOSITORY } from '../domain/repositories/post.repository.interface';
import { CommandBus, QueryBus } from '../cqrs-example/command-bus';
import { CreatePostCommandHandler } from '../cqrs-example/commands/create-post.command';
import { GetPostQueryHandler } from '../cqrs-example/queries/get-post.query';

@Module({
  controllers: [PostsController],
  providers: [
    // Infrastructure: Repository 구현체를 DI 토큰으로 등록
    {
      provide: POST_REPOSITORY,
      useClass: PostInMemoryRepository,
      /**
       * 실제 TypeORM 사용 시:
       * useClass: PostTypeormRepository
       *
       * 테스트 시:
       * useClass: PostFakeRepository (가짜 구현체)
       */
    },

    // Domain Services
    PostDomainService,

    // Application: Use Cases
    CreatePostUseCase,
    GetPostUseCase,
    ListPostsUseCase,
    UpdatePostUseCase,
    DeletePostUseCase,

    // CQRS
    CommandBus,
    QueryBus,
    CreatePostCommandHandler,
    GetPostQueryHandler,
  ],
})
export class PostsModule {}

/**
 * Provider 등록 방식 정리
 * =======================
 *
 * 1. 기본 (클래스 자체를 토큰으로):
 *    providers: [PostDomainService]
 *    = { provide: PostDomainService, useClass: PostDomainService }
 *
 * 2. 인터페이스 토큰 (추상화):
 *    { provide: POST_REPOSITORY, useClass: PostInMemoryRepository }
 *    → IPostRepository를 사용하지만 실제로는 InMemory 사용
 *
 * 3. 값으로 등록:
 *    { provide: 'DB_CONFIG', useValue: { host: 'localhost', port: 5432 } }
 *
 * 4. 팩토리로 등록:
 *    { provide: 'CACHE', useFactory: () => new RedisCache() }
 *
 * 5. 기존 Provider 재사용:
 *    { provide: 'LEGACY_REPO', useExisting: PostInMemoryRepository }
 */
