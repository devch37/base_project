/**
 * update-user.dto.ts
 * ----------------------------------------------------------------------------
 * PartialType(CreateUserDto) → CreateUserDto 의 모든 필드를 "옵셔널"로 만든 DTO.
 * 검증 규칙(@IsEmail 등)은 그대로 상속되며, 값이 있을 때만 적용됩니다.
 * PATCH 요청(부분 수정)에 적합합니다.
 *
 * 여기서는 비밀번호/이메일 변경은 별도 플로우로 다루는 편이 안전하므로
 * OmitType 으로 제외하고 nickname 만 수정 가능하게 했습니다.
 */
import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'password'] as const),
) {}
