package be.com.springbootclaude.security.controller

import be.com.springbootclaude.security.jwt.JwtTokenProvider
import be.com.springbootclaude.security.service.RefreshTokenService
import be.com.springbootclaude.security.service.TokenBlacklistService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.User
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.bind.annotation.*

/**
 * Authentication Controller
 *
 * 제공 API:
 * 1. POST /api/auth/login - 일반 로그인
 * 2. POST /api/auth/refresh - Access Token 갱신
 * 3. POST /api/auth/logout - 로그아웃
 * 4. GET /api/auth/me - 현재 사용자 정보
 */
@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val jwtTokenProvider: JwtTokenProvider,
    private val refreshTokenService: RefreshTokenService,
    private val tokenBlacklistService: TokenBlacklistService,
    private val passwordEncoder: PasswordEncoder
) {

    /**
     * 일반 로그인 (이메일 + 비밀번호)
     *
     * OAuth가 아닌 전통적인 로그인 방식
     * 실제로는 UserDetailsService와 연동
     */
    @PostMapping("/login")
    fun login(@RequestBody request: LoginRequest, httpRequest: HttpServletRequest): ResponseEntity<TokenResponse> {
        // 1. 사용자 인증 (실제로는 UserDetailsService 사용)
        // val user = userService.findByEmail(request.email)
        // if (!passwordEncoder.matches(request.password, user.password)) {
        //     throw BadCredentialsException("잘못된 비밀번호")
        // }

        // 2. Authentication 객체 생성 (예시)
        val authorities = listOf(SimpleGrantedAuthority("ROLE_USER"))
        val authentication = UsernamePasswordAuthenticationToken(
            User(request.email, "", authorities),
            null,
            authorities
        )

        // 3. JWT 토큰 발급
        val accessToken = jwtTokenProvider.createAccessToken(authentication)
        val refreshToken = jwtTokenProvider.createRefreshToken(authentication)

        // 4. Refresh Token 저장
        refreshTokenService.createRefreshToken(request.email, refreshToken, httpRequest)

        return ResponseEntity.ok(
            TokenResponse(
                accessToken = accessToken,
                refreshToken = refreshToken,
                tokenType = "Bearer"
            )
        )
    }

    /**
     * Access Token 갱신
     *
     * Refresh Token으로 새로운 Access Token 발급
     * ★ Refresh Token Rotation 적용 ★
     */
    @PostMapping("/refresh")
    fun refreshToken(
        @RequestBody request: RefreshTokenRequest,
        httpRequest: HttpServletRequest
    ): ResponseEntity<TokenResponse> {
        // 1. Refresh Token으로 새 토큰 발급
        val tokens = refreshTokenService.refreshAccessToken(request.refreshToken, httpRequest)
            ?: return ResponseEntity.status(401).build()

        val (newAccessToken, newRefreshToken) = tokens

        return ResponseEntity.ok(
            TokenResponse(
                accessToken = newAccessToken,
                refreshToken = newRefreshToken,
                tokenType = "Bearer"
            )
        )
    }

    /**
     * 로그아웃
     *
     * ★ 토큰 탈취 대응의 핵심! ★
     * 1. Access Token을 Blacklist에 추가
     * 2. Refresh Token DB에서 삭제
     */
    @PostMapping("/logout")
    fun logout(
        @RequestBody request: LogoutRequest,
        @AuthenticationPrincipal user: User?
    ): ResponseEntity<Map<String, String>> {
        // 1. Access Token을 Blacklist에 추가
        tokenBlacklistService.addToBlacklist(request.accessToken)

        // 2. Refresh Token 삭제
        if (request.refreshToken != null) {
            refreshTokenService.revokeToken(request.refreshToken)
        }

        // 3. 해당 사용자의 모든 토큰 무효화 (선택적)
        if (user != null) {
            refreshTokenService.revokeAllTokens(user.username)
        }

        return ResponseEntity.ok(mapOf("message" to "로그아웃 성공"))
    }

    /**
     * 현재 사용자 정보 조회
     *
     * JWT 토큰으로 인증된 사용자 정보 반환
     */
    @GetMapping("/me")
    fun getCurrentUser(@AuthenticationPrincipal user: User): ResponseEntity<UserInfoResponse> {
        return ResponseEntity.ok(
            UserInfoResponse(
                email = user.username,
                authorities = user.authorities.map { it.authority }
            )
        )
    }

    /**
     * 계정 탈취 의심 시 모든 세션 강제 종료
     *
     * 관리자 또는 사용자 본인만 호출 가능
     */
    @PostMapping("/revoke-all-sessions")
    fun revokeAllSessions(@AuthenticationPrincipal user: User): ResponseEntity<Map<String, String>> {
        // 사용자의 모든 Refresh Token 삭제
        refreshTokenService.revokeAllTokens(user.username)

        // 모든 Access Token을 Blacklist에 추가 (실제로는 더 정교하게)
        tokenBlacklistService.blacklistAllUserTokens(user.username)

        return ResponseEntity.ok(mapOf(
            "message" to "모든 세션이 종료되었습니다. 다시 로그인해주세요."
        ))
    }
}

/**
 * Request/Response DTOs
 */
data class LoginRequest(
    val email: String,
    val password: String
)

data class RefreshTokenRequest(
    val refreshToken: String
)

data class LogoutRequest(
    val accessToken: String,
    val refreshToken: String?
)

data class TokenResponse(
    val accessToken: String,
    val refreshToken: String,
    val tokenType: String = "Bearer"
)

data class UserInfoResponse(
    val email: String,
    val authorities: List<String>
)
