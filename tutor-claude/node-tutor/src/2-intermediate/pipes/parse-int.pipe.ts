/**
 * ============================================
 * ParseInt Pipe - 문자열을 정수로 변환하는 파이프
 * ============================================
 *
 * 파이프의 Transformation 역할 예시
 * - URL 파라미터는 항상 문자열로 전달됨 ('/posts/1' → '1')
 * - 이를 숫자로 변환해야 서비스에서 사용 가능
 *
 * NestJS 내장 ParseIntPipe가 있지만
 * 커스터마이징을 위해 직접 구현하는 방법을 보여줍니다.
 *
 * 사용 예:
 * @Get(':id')
 * findOne(@Param('id', CustomParseIntPipe) id: number) { ... }
 * // 'abc' → BadRequestException
 * // '42'  → 42 (number)
 */

import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class CustomParseIntPipe implements PipeTransform<string, number> {
  /**
   * transform()
   * ===========
   * @param value - 변환할 값 (URL 파라미터에서 온 문자열)
   * @param metadata - 파라미터 메타데이터
   * @returns 변환된 정수
   * @throws BadRequestException - 정수로 변환 불가 시
   */
  transform(value: string, metadata: ArgumentMetadata): number {
    // parseInt로 정수 변환 시도
    const parsed = parseInt(value, 10);

    /**
     * isNaN() 체크
     * - parseInt('abc') → NaN
     * - parseInt('12abc') → 12 (주의! 앞부분만 변환됨)
     */
    if (isNaN(parsed)) {
      throw new BadRequestException(
        `'${value}'는 유효한 정수가 아닙니다. 숫자를 입력해주세요.`,
      );
    }

    // 양의 정수인지 확인 (ID는 항상 양수)
    if (parsed <= 0) {
      throw new BadRequestException(
        `ID는 양의 정수여야 합니다. 입력값: ${value}`,
      );
    }

    return parsed;
  }
}

/**
 * 범위 검증이 있는 ParseInt 파이프
 * ==================================
 */
@Injectable()
export class ParseIntRangePipe implements PipeTransform<string, number> {
  constructor(
    private readonly min: number = 1,
    private readonly max: number = 1000,
  ) {}

  transform(value: string, metadata: ArgumentMetadata): number {
    const parsed = parseInt(value, 10);

    if (isNaN(parsed)) {
      throw new BadRequestException(`유효한 숫자를 입력해주세요. 입력값: '${value}'`);
    }

    if (parsed < this.min || parsed > this.max) {
      throw new BadRequestException(
        `값은 ${this.min}에서 ${this.max} 사이여야 합니다. 입력값: ${parsed}`,
      );
    }

    return parsed;
  }
}

/**
 * 내장 Pipe 목록
 * ===============
 *
 * NestJS가 제공하는 내장 파이프들:
 *
 * - ParseIntPipe     : string → number (정수)
 * - ParseFloatPipe   : string → number (소수)
 * - ParseBoolPipe    : string → boolean ('true'/'false')
 * - ParseArrayPipe   : string → array
 * - ParseUUIDPipe    : UUID 형식 검증
 * - ParseEnumPipe    : Enum 값 검증
 * - DefaultValuePipe : 기본값 설정
 * - ValidationPipe   : class-validator 기반 검증
 *
 * 사용 예시:
 * @Param('id', ParseIntPipe) id: number
 * @Query('active', ParseBoolPipe) active: boolean
 * @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
 */

/**
 * 파이프 적용 레벨
 * ================
 *
 * 1. 파라미터 레벨 (가장 세밀):
 *    @Get(':id')
 *    findOne(@Param('id', ParseIntPipe) id: number) { ... }
 *
 * 2. 핸들러 레벨:
 *    @UsePipes(new ValidationPipe())
 *    @Post()
 *    create(@Body() dto: CreatePostDto) { ... }
 *
 * 3. 컨트롤러 레벨:
 *    @UsePipes(ValidationPipe)
 *    @Controller('posts')
 *    export class PostsController { ... }
 *
 * 4. 전역 레벨 (main.ts):
 *    app.useGlobalPipes(new ValidationPipe());
 */
