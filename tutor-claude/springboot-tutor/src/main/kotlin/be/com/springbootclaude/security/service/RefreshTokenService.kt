package be.com.springbootclaude.security.service

import be.com.springbootclaude.security.domain.RefreshToken
import be.com.springbootclaude.security.jwt.JwtTokenProvider
import be.com.springbootclaude.security.repository.RefreshTokenRepository
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

/**
 * Refresh Token Service
 *
 * Refresh Token 관리:
 * 1. 토큰 발급 및 저장
 * 2. 토큰 검증 및 갱신
 * 3. 토큰 무효화 (로그아웃)
 * 4. 만료된 토큰 정리
 */
@Service
@Transactional
class RefreshTokenService(
    private val refreshTokenRepository: RefreshTokenRepository,
    private val jwtTokenProvider: JwtTokenProvider
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * Refresh Token 생성 및 저장
     *
     * 보안 강화:
     * - IP 주소 저장
     * - User-Agent 저장
     * - 발급 기록 추적
     */
    fun createRefreshToken(
        userEmail: String,
        token: String,
        request: HttpServletRequest
    ): RefreshToken {
        // 기존 토큰 삭제 (선택적: 단일 세션 정책)
        // deleteByUserEmail(userEmail)

        val expiresAt = jwtTokenProvider.getExpirationDate(token)
        val refreshToken = RefreshToken(
            userEmail = userEmail,
            token = token,
            expiresAt = expiresAt.toInstant()
                .atZone(java.time.ZoneId.systemDefault())
                .toLocalDateTime(),
            ipAddress = request.remoteAddr,
            userAgent = request.getHeader("User-Agent")
        )

        return refreshTokenRepository.save(refreshToken)
    }

    /**
     * Refresh Token 검증
     *
     * 검증 항목:
     * 1. 토큰이 DB에 존재하는가
     * 2. 만료되지 않았는가
     * 3. (선택적) IP 주소 일치하는가
     * 4. (선택적) User-Agent 일치하는가
     */
    fun validateRefreshToken(
        token: String,
        request: HttpServletRequest? = null
    ): RefreshToken? {
        val refreshToken = refreshTokenRepository.findByToken(token)
            ?: return null

        // 만료 확인
        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken)
            return null
        }

        // IP 검증 (선택적, 보안 레벨에 따라)
        if (request != null && refreshToken.ipAddress != null) {
            val currentIp = request.remoteAddr
            if (currentIp != refreshToken.ipAddress) {
                logger.warn("🚨 IP 불일치 감지: user=${refreshToken.userEmail}, " +
                        "original=$refreshToken.ipAddress, current=$currentIp")
                // 필요시 토큰 무효화 또는 추가 인증 요구
                // return null
            }
        }

        return refreshToken
    }

    /**
     * Access Token 갱신
     *
     * Refresh Token Rotation (Best Practice):
     * 1. Refresh Token으로 새 Access Token 발급
     * 2. 새로운 Refresh Token도 함께 발급
     * 3. 기존 Refresh Token 무효화
     */
    fun refreshAccessToken(
        refreshToken: String,
        request: HttpServletRequest
    ): Pair<String, String>? {
        // 1. Refresh Token 검증
        val storedToken = validateRefreshToken(refreshToken, request)
            ?: return null

        // 2. JWT 검증
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            return null
        }

        // 3. 새 Access Token 생성
        val authentication = jwtTokenProvider.getAuthentication(refreshToken)
        val newAccessToken = jwtTokenProvider.createAccessToken(authentication)

        // 4. Refresh Token Rotation (새 Refresh Token 발급)
        val newRefreshToken = jwtTokenProvider.createRefreshToken(authentication)
        val newExpiresAt = jwtTokenProvider.getExpirationDate(newRefreshToken)
            .toInstant()
            .atZone(java.time.ZoneId.systemDefault())
            .toLocalDateTime()

        storedToken.rotate(newRefreshToken, newExpiresAt)
        refreshTokenRepository.save(storedToken)

        logger.info("✅ 토큰 갱신 성공: user=${storedToken.userEmail}")

        return Pair(newAccessToken, newRefreshToken)
    }

    /**
     * 사용자의 모든 Refresh Token 삭제 (로그아웃)
     */
    fun revokeAllTokens(userEmail: String) {
        refreshTokenRepository.deleteByUserEmail(userEmail)
        logger.info("🔒 모든 토큰 무효화: user=$userEmail")
    }

    /**
     * 특정 Refresh Token 삭제
     */
    fun revokeToken(token: String) {
        val refreshToken = refreshTokenRepository.findByToken(token)
        if (refreshToken != null) {
            refreshTokenRepository.delete(refreshToken)
            logger.info("🔒 토큰 무효화: user=${refreshToken.userEmail}")
        }
    }

    /**
     * 만료된 토큰 정리 (스케줄링)
     * 매일 새벽 3시에 실행
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    fun cleanupExpiredTokens() {
        val now = LocalDateTime.now()
        val deletedCount = refreshTokenRepository.deleteExpiredTokens(now)
        logger.info("🧹 만료된 토큰 정리 완료: $deletedCount 개")

        // 30일 이상 사용되지 않은 토큰 삭제
        val threshold = now.minusDays(30)
        val unusedCount = refreshTokenRepository.deleteUnusedTokens(threshold)
        logger.info("🧹 미사용 토큰 정리 완료: $unusedCount 개")
    }
}
