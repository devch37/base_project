/**
 * register.dto.ts
 * ----------------------------------------------------------------------------
 * 회원가입 입력. 사용자 생성 규칙과 동일하므로 CreateUserDto 를 그대로 재사용합니다.
 * (규칙이 갈라질 조짐이 보이면 그때 분리하세요 — 성급한 추상화는 피할 것)
 */
export { CreateUserDto as RegisterDto } from '../../users/dto/create-user.dto';
