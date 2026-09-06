/**
 * ============================================================================
 * pagination-query.dto.ts — 목록 API의 공통 쿼리 파라미터
 * ----------------------------------------------------------------------------
 * GET /posts?page=2&limit=20&sort=createdAt&order=DESC
 *
 * 쿼리스트링은 항상 "문자열"로 들어옵니다. class-transformer 의 @Type(() => Number)
 * 이 숫자로 바꿔 주고, class-validator 가 범위를 검증합니다.
 * (main.ts 의 ValidationPipe 에서 transform:true 가 켜져 있어야 동작)
 * ============================================================================
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: '페이지 번호(1부터)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: '페이지당 개수',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100) // 클라이언트가 limit=100000 으로 DB를 괴롭히지 못하게 상한을 둔다
  limit: number = 20;

  @ApiPropertyOptional({ description: '정렬 기준 컬럼', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sort: string = 'createdAt';

  @ApiPropertyOptional({
    description: '정렬 방향',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC' = 'DESC';

  /** TypeORM find 의 skip 값으로 바로 쓸 수 있는 헬퍼 */
  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}
