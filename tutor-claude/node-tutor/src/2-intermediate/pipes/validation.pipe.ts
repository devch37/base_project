/**
 * ============================================
 * Custom Validation Pipe - 커스텀 검증 파이프
 * ============================================
 *
 * Pipe (파이프)란?
 * - 컨트롤러 핸들러 실행 직전에 실행
 * - 두 가지 역할:
 *   1. Transformation: 데이터 변환 (string → number 등)
 *   2. Validation: 데이터 검증 (형식, 범위 확인)
 *
 * 요청 흐름에서 위치:
 * Middleware → Guard → Interceptor → Pipe → Controller Handler
 *
 * 실무에서는 class-validator + NestJS ValidationPipe를 사용하지만
 * 이 예제는 원리 이해를 위한 직접 구현입니다.
 */

import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

/**
 * 검증 규칙 타입 정의
 */
interface ValidationRules {
  [key: string]: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    type?: 'string' | 'number' | 'boolean';
    pattern?: RegExp;
  };
}

/**
 * CustomValidationPipe
 * ====================
 * 요청 데이터를 검증하는 파이프
 *
 * PipeTransform<T, R>:
 * - T: 입력 타입
 * - R: 출력 타입 (변환 후)
 */
@Injectable()
export class CustomValidationPipe implements PipeTransform {
  constructor(private readonly rules?: ValidationRules) {}

  /**
   * transform()
   * ===========
   * @param value - 컨트롤러 매개변수에 바인딩될 값 (요청 데이터)
   * @param metadata - 변환 대상의 타입 정보
   * @returns 검증된 (변환된) 값
   * @throws BadRequestException - 검증 실패 시
   *
   * ArgumentMetadata:
   * - metatype: 매개변수의 TypeScript 타입
   * - type: 'body' | 'query' | 'param' | 'custom'
   * - data: 데코레이터에서 전달된 데이터 ('id', 'name' 등)
   */
  transform(value: any, metadata: ArgumentMetadata): any {
    // 원시 타입(primitive)이거나 규칙이 없으면 그대로 반환
    if (!this.rules || this.isPrimitive(value)) {
      return value;
    }

    const errors: string[] = [];

    // 각 규칙에 대해 검증 실행
    for (const [field, rule] of Object.entries(this.rules)) {
      const fieldValue = value?.[field];

      // 필수값 검증
      if (rule.required && (fieldValue === undefined || fieldValue === null || fieldValue === '')) {
        errors.push(`'${field}' 필드는 필수입니다`);
        continue;
      }

      // 값이 없으면 나머지 검증 스킵
      if (fieldValue === undefined || fieldValue === null) {
        continue;
      }

      // 타입 검증
      if (rule.type && typeof fieldValue !== rule.type) {
        errors.push(`'${field}' 필드는 ${rule.type} 타입이어야 합니다`);
        continue;
      }

      // 문자열 길이 검증
      if (typeof fieldValue === 'string') {
        if (rule.minLength !== undefined && fieldValue.length < rule.minLength) {
          errors.push(`'${field}' 필드는 최소 ${rule.minLength}자 이상이어야 합니다`);
        }
        if (rule.maxLength !== undefined && fieldValue.length > rule.maxLength) {
          errors.push(`'${field}' 필드는 최대 ${rule.maxLength}자 이하이어야 합니다`);
        }
        if (rule.pattern && !rule.pattern.test(fieldValue)) {
          errors.push(`'${field}' 필드의 형식이 올바르지 않습니다`);
        }
      }

      // 숫자 범위 검증
      if (typeof fieldValue === 'number') {
        if (rule.min !== undefined && fieldValue < rule.min) {
          errors.push(`'${field}' 필드는 ${rule.min} 이상이어야 합니다`);
        }
        if (rule.max !== undefined && fieldValue > rule.max) {
          errors.push(`'${field}' 필드는 ${rule.max} 이하이어야 합니다`);
        }
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: '입력값 검증 실패',
        errors,
      });
    }

    return value;
  }

  private isPrimitive(value: any): boolean {
    return ['string', 'number', 'boolean'].includes(typeof value) || value === null;
  }
}

/**
 * 실무에서 사용하는 class-validator 방식 (참고)
 * =============================================
 *
 * 1. 패키지 설치:
 *    npm install class-validator class-transformer
 *
 * 2. DTO에 데코레이터 추가:
 *    import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
 *
 *    export class CreatePostDto {
 *      @IsNotEmpty({ message: '제목은 필수입니다' })
 *      @IsString()
 *      @MinLength(2, { message: '제목은 2자 이상이어야 합니다' })
 *      @MaxLength(100, { message: '제목은 100자 이하이어야 합니다' })
 *      title: string;
 *
 *      @IsNotEmpty({ message: '내용은 필수입니다' })
 *      @IsString()
 *      @MinLength(10)
 *      content: string;
 *    }
 *
 * 3. main.ts에서 전역 파이프 등록:
 *    app.useGlobalPipes(
 *      new ValidationPipe({
 *        whitelist: true,          // DTO에 없는 필드 제거
 *        forbidNonWhitelisted: true, // 없는 필드가 있으면 에러
 *        transform: true,          // 자동 타입 변환
 *        transformOptions: {
 *          enableImplicitConversion: true,
 *        },
 *      })
 *    );
 *
 * 이 방식이 가장 권장되는 실무 방식입니다!
 */
