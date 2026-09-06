import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  Index,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from './post.entity';

/**
 * 태그 — 게시글과 N:M 관계.
 * 여기서는 BaseEntity 를 상속하지 않고 최소 컬럼만 둡니다(순수 참조 데이터).
 */
@Entity('tags')
export class Tag {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'nestjs' })
  @Index({ unique: true })
  @Column()
  name: string;

  @ManyToMany(() => Post, (post) => post.tags)
  posts: Post[];
}
