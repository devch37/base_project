/**
 * query-posts.dto.ts
 * ----------------------------------------------------------------------------
 * 목록 조회 필터. 공통 페이지네이션(PaginationQueryDto)을 상속하고
 * 게시글 전용 필터(검색어, 태그, 작성자)를 추가합니다.
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryPostsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '제목/내용 검색어' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '태그 이름' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ description: '작성자 id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  authorId?: number;
}
