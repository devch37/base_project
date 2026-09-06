/**
 * ============================================================================
 * user.entity.ts — 사용자 엔티티 (DB 테이블 = users)
 * ----------------------------------------------------------------------------
 * TypeORM 데코레이터로 "클래스 = 테이블, 프로퍼티 = 컬럼" 을 매핑합니다.
 * ============================================================================
 */
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Role } from '../../../common/enums/role.enum';
import { Comment } from '../../comments/entities/comment.entity';
import { Post } from '../../posts/entities/post.entity';

@Entity('users')
export class User extends BaseEntity {
  @ApiProperty({ example: 'gildong@example.com' })
  @Index({ unique: true }) // 이메일 중복 방지 + 조회 성능
  @Column()
  email: string;

  @ApiProperty({ example: '홍길동' })
  @Column()
  nickname: string;

  /**
   * 비밀번호 해시.
   *  - select: false → 기본 SELECT 에서 제외 (실수로 응답에 노출되는 것 방지)
   *  - 비밀번호 검증 시에는 .createQueryBuilder().addSelect('user.password') 로 명시 조회
   *  - @Exclude() → 혹시 객체가 직렬화되어도 JSON 에서 빠지도록 이중 방어
   */
  @ApiHideProperty()
  @Exclude()
  @Column({ select: false })
  password: string;

  @ApiProperty({ enum: Role, example: Role.USER })
  @Column({ type: 'varchar', default: Role.USER })
  role: Role;

  /**
   * 리프레시 토큰의 해시를 저장 (로그인 시 갱신, 로그아웃 시 null).
   * 토큰 자체가 아니라 해시를 저장해야 DB 유출 시에도 안전합니다.
   */
  @ApiHideProperty()
  @Exclude()
  @Column({ type: 'varchar', nullable: true, select: false })
  hashedRefreshToken: string | null;

  // --- 관계 --------------------------------------------------------------
  // 한 사용자는 여러 게시글/댓글을 가진다 (1:N)
  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments: Comment[];
}
