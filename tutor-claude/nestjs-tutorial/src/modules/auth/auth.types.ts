import { Role } from '../../common/enums/role.enum';

/** 액세스 토큰에 담기는 클레임(payload) */
export interface AccessTokenPayload {
  sub: number; // subject = 사용자 id (JWT 표준 클레임)
  email: string;
  role: Role;
}

/** 리프레시 토큰에 담기는 클레임 (최소한만) */
export interface RefreshTokenPayload {
  sub: number;
}

/** 로그인/갱신 시 클라이언트에 내려주는 토큰 쌍 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
