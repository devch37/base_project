package be.com.springbootclaude.security.jwt

import io.jsonwebtoken.*
import io.jsonwebtoken.io.Decoders
import io.jsonwebtoken.security.Keys
import io.jsonwebtoken.security.SignatureException
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.User
import org.springframework.stereotype.Component
import java.security.Key
import java.util.*

/**
 * JWT Token Provider
 *
 * JWT (JSON Web Token)란?
 * - 인증 정보를 JSON 형태로 안전하게 전송하기 위한 토큰
 * - 서버에 세션을 저장하지 않아도 됨 (Stateless)
 * - Header.Payload.Signature 구조
 *
 * Access Token vs Refresh Token:
 * - Access Token: 짧은 유효기간 (15분~1시간), API 요청 시 사용
 * - Refresh Token: 긴 유효기간 (7일~30일), Access Token 재발급용
 *
 * 왜 두 개로 나누나?
 * - Access Token 탈취 시 피해 최소화 (짧은 유효기간)
 * - Refresh Token은 안전하게 저장 (Redis, HttpOnly Cookie)
 */
@Component
class JwtTokenProvider(
    @Value("\${jwt.secret}")
    private val jwtSecret: String,

    @Value("\${jwt.access-token-validity:900000}")  // 15분
    private val accessTokenValidityInMilliseconds: Long,

    @Value("\${jwt.refresh-token-validity:604800000}")  // 7일
    private val refreshTokenValidityInMilliseconds: Long
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * JWT 서명에 사용할 Secret Key
     * - Base64로 인코딩된 비밀키를 디코딩
     * - HMAC-SHA 알고리즘 사용
     */
    private val key: Key by lazy {
        Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret))
    }

    /**
     * Access Token 생성
     *
     * Claim에 포함할 정보:
     * - sub (subject): 사용자 식별자 (email)
     * - auth: 권한 정보 (ROLE_USER, ROLE_ADMIN 등)
     * - type: 토큰 타입 (access)
     * - iat (issued at): 발급 시간
     * - exp (expiration): 만료 시간
     */
    fun createAccessToken(authentication: Authentication): String {
        val authorities = authentication.authorities.joinToString(",") { it.authority }

        val now = Date()
        val validity = Date(now.time + accessTokenValidityInMilliseconds)

        return Jwts.builder()
            .setSubject(authentication.name)  // 사용자 이메일 or ID
            .claim("auth", authorities)       // 권한 정보
            .claim("type", "access")          // 토큰 타입
            .setIssuedAt(now)
            .setExpiration(validity)
            .signWith(key, SignatureAlgorithm.HS512)
            .compact()
    }

    /**
     * Refresh Token 생성
     *
     * Refresh Token 특징:
     * - Claim을 최소화 (보안)
     * - 유효기간이 김
     * - Redis 등에 별도 저장하여 추가 검증
     */
    fun createRefreshToken(authentication: Authentication): String {
        val now = Date()
        val validity = Date(now.time + refreshTokenValidityInMilliseconds)

        return Jwts.builder()
            .setSubject(authentication.name)
            .claim("type", "refresh")
            .setIssuedAt(now)
            .setExpiration(validity)
            .signWith(key, SignatureAlgorithm.HS512)
            .compact()
    }

    /**
     * HTTP Request에서 Bearer Token 추출
     *
     * Authorization: Bearer <token>
     */
    fun resolveToken(request: HttpServletRequest): String? {
        val bearerToken = request.getHeader("Authorization")
        return if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            bearerToken.substring(7)
        } else {
            null
        }
    }

    /**
     * 토큰 검증
     *
     * 검증 항목:
     * 1. 서명 유효성 (Secret Key로 검증)
     * 2. 만료 시간
     * 3. 토큰 구조
     *
     * 보안 고려사항:
     * - 각 예외를 세분화하여 로깅
     * - 공격 시도 감지 가능
     */
    fun validateToken(token: String): Boolean {
        try {
            Jwts.parser()
                .verifyWith(key as javax.crypto.SecretKey)
                .build()
                .parseSignedClaims(token)
            return true
        } catch (e: SignatureException) {
            logger.error("⚠️ 잘못된 JWT 서명입니다")
        } catch (e: MalformedJwtException) {
            logger.error("⚠️ 잘못된 JWT 토큰입니다")
        } catch (e: ExpiredJwtException) {
            logger.error("⚠️ 만료된 JWT 토큰입니다")
        } catch (e: UnsupportedJwtException) {
            logger.error("⚠️ 지원되지 않는 JWT 토큰입니다")
        } catch (e: IllegalArgumentException) {
            logger.error("⚠️ JWT 토큰이 잘못되었습니다")
        }
        return false
    }

    /**
     * 토큰에서 Authentication 객체 추출
     *
     * Spring Security의 인증 객체로 변환
     * - Principal: 사용자 정보
     * - Credentials: 자격 증명 (비밀번호 등, 여기선 null)
     * - Authorities: 권한 목록
     */
    fun getAuthentication(token: String): Authentication {
        val claims = getClaims(token)

        val authorities = claims["auth"]?.toString()
            ?.split(",")
            ?.map { SimpleGrantedAuthority(it) }
            ?: emptyList()

        val principal = User(claims.subject, "", authorities)

        return UsernamePasswordAuthenticationToken(principal, token, authorities)
    }

    /**
     * 토큰에서 Claims 추출
     */
    private fun getClaims(token: String): Claims {
        return Jwts.parser()
            .verifyWith(key as javax.crypto.SecretKey)
            .build()
            .parseSignedClaims(token)
            .payload
    }

    /**
     * 토큰에서 사용자 이메일 추출
     */
    fun getEmailFromToken(token: String): String {
        return getClaims(token).subject
    }

    /**
     * 토큰 타입 확인 (access or refresh)
     */
    fun getTokenType(token: String): String? {
        return getClaims(token)["type"]?.toString()
    }

    /**
     * 토큰 만료 시간 확인
     */
    fun getExpirationDate(token: String): Date {
        return getClaims(token).expiration
    }

    /**
     * 토큰이 곧 만료되는지 확인 (예: 5분 이내)
     * 토큰 갱신 시점 판단에 사용
     */
    fun isTokenExpiringSoon(token: String, thresholdMinutes: Long = 5): Boolean {
        val expiration = getExpirationDate(token)
        val now = Date()
        val thresholdTime = Date(now.time + (thresholdMinutes * 60 * 1000))

        return expiration.before(thresholdTime)
    }
}
