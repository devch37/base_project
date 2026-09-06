/**
 * ============================================================================
 * post.entity.ts — 게시글 엔티티 (테이블 = posts)
 * ----------------------------------------------------------------------------
 * 관계 데코레이터:
 *  · @ManyToOne : 여러 게시글 → 한 명의 작성자
 *  · @OneToMany : 한 게시글 → 여러 댓글
 *  · @ManyToMany: 게시글 ↔ 태그 (조인 테이블 자동 생성)
 * ============================================================================
 */
import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { User } from '../../users/entities/user.entity';
import { Tag } from './tag.entity';

@Entity('posts')
export class Post extends BaseEntity {
  @ApiProperty({ example: 'NestJS 입문기' })
  @Index() // 제목 검색이 잦다면 인덱스
  @Column()
  title: string;

  @ApiProperty()
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: '조회수', default: 0 })
  @Column({ default: 0 })
  viewCount: number;

  @ApiProperty({ description: '발행 여부', default: true })
  @Column({ default: true })
  published: boolean;

  // --- 관계 --------------------------------------------------------------

  /**
   * 작성자.
   *  · eager: false (기본) → 필요할 때만 relations 로 로드 (N+1 주의)
   *  · onDelete: 'CASCADE' → 사용자가 삭제되면 게시글도 삭제
   *  · @Index 로 authorId 조회 최적화
   */
  @ManyToOne(() => User, (user) => user.posts, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @Index()
  author: User;

  // 관계 컬럼의 FK 값을 엔티티 로드 없이 바로 쓰기 위한 필드
  @Column()
  authorId: number;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @ManyToMany(() => Tag, (tag) => tag.posts, { cascade: true })
  @JoinTable({ name: 'post_tags' }) // 소유(owning) 측에만 @JoinTable
  tags: Tag[];
}
