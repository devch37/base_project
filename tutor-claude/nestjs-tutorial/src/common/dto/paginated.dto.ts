/**
 * 페이지네이션 결과를 담는 공통 형태 + 생성 헬퍼.
 * 서비스에서 `return paginate(items, total, query)` 처럼 사용합니다.
 */
import { ApiProperty } from '@nestjs/swagger';
import { PaginationQueryDto } from './pagination-query.dto';

export class PageMeta {
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalItems: number;
  @ApiProperty() totalPages: number;
  @ApiProperty() hasNextPage: boolean;
  @ApiProperty() hasPreviousPage: boolean;
}

export class Paginated<T> {
  items: T[];
  meta: PageMeta;
}

export function paginate<T>(
  items: T[],
  totalItems: number,
  query: Pick<PaginationQueryDto, 'page' | 'limit'>,
): Paginated<T> {
  const totalPages = Math.max(1, Math.ceil(totalItems / query.limit));
  return {
    items,
    meta: {
      page: query.page,
      limit: query.limit,
      totalItems,
      totalPages,
      hasNextPage: query.page < totalPages,
      hasPreviousPage: query.page > 1,
    },
  };
}
