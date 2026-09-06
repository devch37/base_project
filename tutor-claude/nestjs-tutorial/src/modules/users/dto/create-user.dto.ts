/**
 * ============================================================================
 * create-user.dto.ts — 사용자 생성 입력 검증
 * ----------------------------------------------------------------------------
 * DTO(Data Transfer Object) = "요청 본문의 모양 + 검증 규칙".
 * class-validator 데코레이터가 규칙을, class-transformer 가 변환을 담당합니다.
 * main.ts 의 전역 ValidationPipe 가 이 클래스를 기준으로 자동 검증합니다.
 * ============================================================================
 */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'gildong@example.com', description: '로그인 이메일' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @ApiProperty({ example: '홍길동', minLength: 2, maxLength: 20 })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  nickname: string;

  @ApiProperty({
    example: 'Passw0rd!',
    description: '영문/숫자 포함 8자 이상',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  @MaxLength(64)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: '비밀번호는 영문과 숫자를 모두 포함해야 합니다.',
  })
  password: string;
}
