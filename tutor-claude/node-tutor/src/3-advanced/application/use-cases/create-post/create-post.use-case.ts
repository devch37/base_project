/**
 * ============================================
 * Create Post Use Case - 게시글 생성 유즈케이스
 * ============================================
 *
 * Use Case (유즈케이스)란?
 * - 하나의 비즈니스 기능을 수행하는 단위
 * - "애플리케이션이 할 수 있는 일"을 표현
 * - 단일 책임 원칙 준수: 하나의 Use Case = 하나의 기능
 *
 * Application Service (Use Case)의 역할:
 * 1. 도메인 객체 가져오기 (Repository)
 * 2. 도메인 로직 실행 (Entity, Domain Service)
 * 3. 변경사항 저장 (Repository)
 * 4. 도메인 이벤트 발행
 * 5. 결과 반환
 *
 * 주의: Application Service는 비즈니스 로직을 직접 구현하지 않음
 * - 도메인 로직은 Entity/Domain Service에 위임
 * - Use Case는 오케스트레이션만 담당
 *
 * 파일 구조 (Use Case 폴더):
 * create-post/
 *   create-post.use-case.ts  ← 이 파일
 *   create-post.dto.ts       ← 입출력 타입
 */

import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { Post } from '../../../domain/entities/post.entity';
import { IPostRepository, POST_REPOSITORY } from '../../../domain/repositories/post.repository.interface';
import { PostDomainService } from '../../../domain/services/post.domain-service';
import { CreatePostCommand, CreatePostResult } from './create-post.dto';

@Injectable()
export class CreatePostUseCase {
  constructor(
    /**
     * @Inject(POST_REPOSITORY)
     * - 인터페이스(IPostRepository)는 런타임에 없음
     * - 문자열 토큰(POST_REPOSITORY)으로 DI
     */
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,

    private readonly postDomainService: PostDomainService,
  ) {}

  /**
   * execute()
   * =========
   * Use Case의 진입점
   * - 하나의 public 메서드만 가짐 (단일 책임)
   * - 이름은 execute() 또는 run() 사용
   */
  async execute(command: CreatePostCommand): Promise<CreatePostResult> {
    // 1. 중복 제목 검사 (도메인 서비스 활용)
    const existingPosts = await this.postRepository.findAll({
      authorId: command.authorId,
      includeDeleted: false,
    });

    const isDuplicate = this.postDomainService.hasDuplicateTitle(
      existingPosts,
      command.title,
      command.authorId,
    );

    if (isDuplicate) {
      throw new ConflictException('같은 제목의 게시글이 이미 존재합니다');
    }

    // 2. 다음 ID 생성
    const id = await this.postRepository.nextId();

    // 3. 도메인 엔티티 생성 (팩토리 메서드 사용)
    //    - Value Object 검증 포함
    //    - 도메인 이벤트 등록
    const post = Post.create({
      id,
      title: command.title,
      content: command.content,
      authorId: command.authorId,
      authorEmail: command.authorEmail,
      tags: command.tags,
    });

    // 4. 저장
    const saved = await this.postRepository.save(post);

    // 5. 도메인 이벤트 수집 및 발행 (간략화)
    const events = saved.pullDomainEvents();
    events.forEach((event) => {
      console.log(`[Domain Event] ${event.eventName}:`, event);
    });

    // 6. 결과 반환 (도메인 엔티티 → Application DTO)
    return {
      id: saved.id,
      title: saved.title.value,
      content: saved.content.value,
      authorId: saved.authorId,
      published: saved.published,
      tags: saved.tags,
      createdAt: saved.createdAt,
    };
  }
}
