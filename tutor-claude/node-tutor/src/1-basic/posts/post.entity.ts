/**
 * ============================================
 * Post Entity - 게시글 엔티티
 * ============================================
 *
 * Entity는 데이터의 구조를 정의하는 클래스입니다.
 * - 데이터베이스 테이블과 매핑됨
 * - 비즈니스 규칙을 포함할 수 있음
 *
 * 이 예제에서는 간단한 클래스로 구현하지만,
 * 실제로는 TypeORM, Prisma 등의 ORM을 사용합니다.
 */

/**
 * Post 클래스
 * - 게시글의 데이터 구조를 정의
 */
export class Post {
  /**
   * 고유 식별자
   * - 각 게시글을 구분하는 유일한 값
   */
  id: number;

  /**
   * 게시글 제목
   */
  title: string;

  /**
   * 게시글 내용
   */
  content: string;

  /**
   * 작성자 ID
   * - User 엔티티와 관계를 가짐
   */
  authorId: number;

  /**
   * 게시 여부
   * - true: 공개, false: 비공개
   */
  published: boolean;

  /**
   * 조회수
   */
  viewCount: number;

  /**
   * 생성 일시
   */
  createdAt: Date;

  /**
   * 수정 일시
   */
  updatedAt: Date;

  /**
   * 생성자
   * - partial: Partial<Post>를 받아 속성을 초기화
   * - Object.assign: 객체의 속성을 복사
   */
  constructor(partial: Partial<Post>) {
    Object.assign(this, partial);
  }
}

/**
 * 실전에서는 TypeORM을 사용합니다
 * =================================
 *
 * import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
 *
 * @Entity('posts')  // 테이블 이름
 * export class Post {
 *   @PrimaryGeneratedColumn()
 *   id: number;
 *
 *   @Column()
 *   title: string;
 *
 *   @Column('text')
 *   content: string;
 *
 *   @Column()
 *   authorId: number;
 *
 *   @Column({ default: false })
 *   published: boolean;
 *
 *   @Column({ default: 0 })
 *   viewCount: number;
 *
 *   @CreateDateColumn()
 *   createdAt: Date;
 *
 *   @UpdateDateColumn()
 *   updatedAt: Date;
 * }
 */

/**
 * Entity vs DTO 차이점
 * ====================
 *
 * Entity:
 * - 데이터베이스 테이블과 매핑
 * - 비즈니스 로직 포함 가능
 * - 내부적으로 사용
 *
 * DTO (Data Transfer Object):
 * - API 요청/응답 데이터 구조
 * - 검증 규칙 포함
 * - 외부와 통신할 때 사용
 */
