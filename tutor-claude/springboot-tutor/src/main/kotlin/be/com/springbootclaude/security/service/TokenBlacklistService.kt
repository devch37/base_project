package be.com.springbootclaude.security.service

import be.com.springbootclaude.security.jwt.JwtTokenProvider
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.util.concurrent.ConcurrentHashMap
import java.util.Date

/**
 * Token Blacklist Service
 *
 * ★ 토큰 탈취 대응의 핵심! ★
 *
 * JWT의 단점:
 * - JWT는 Stateless이므로 서버에서 강제로 무효화할 수 없음
 * - 한번 발급된 토큰은 만료 전까지 유효
 * - 토큰 탈취 시 문제 발생
 *
 * Blacklist 전략:
 * 1. 로그아웃 시 토큰을 Blacklist에 추가
 * 2. 의심스러운 활동 감지 시 토큰 Blacklist 추가
 * 3. 모든 요청에서 Blacklist 확인
 *
 * 실무에서는:
 * - Redis 사용 (빠른 조회, TTL 자동 만료)
 * - 만료된 토큰은 자동으로 제거
 * - 메모리 효율적
 *
 * 여기서는 학습을 위해 ConcurrentHashMap 사용
 * (실제로는 Redis 사용 권장!)
 */
@Service
class TokenBlacklistService(
    private val jwtTokenProvider: JwtTokenProvider
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * Blacklist 저장소
     * Key: 토큰
     * Value: 만료 시간
     *
     * 실무: Redis를 사용하면 아래처럼 간단
     * redisTemplate.opsForValue().set(token, "blacklisted", duration, TimeUnit.MILLISECONDS)
     */
    private val blacklist = ConcurrentHashMap<String, Date>()

    /**
     * 토큰을 Blacklist에 추가
     *
     * 사용 시나리오:
     * 1. 사용자 로그아웃
     * 2. 계정 탈취 의심
     * 3. 관리자가 강제 로그아웃
     * 4. 비정상 활동 감지
     */
    fun addToBlacklist(token: String) {
        try {
            val expirationDate = jwtTokenProvider.getExpirationDate(token)
            blacklist[token] = expirationDate

            logger.info("🚫 토큰이 Blacklist에 추가되었습니다")

            // 만료된 토큰 정리
            cleanupExpiredTokens()
        } catch (e: Exception) {
            logger.error("❌ Blacklist 추가 실패", e)
        }
    }

    /**
     * 토큰이 Blacklist에 있는지 확인
     *
     * 모든 API 요청마다 호출되므로 빠르게 동작해야 함
     * Redis를 사용하면 O(1) 조회
     */
    fun isBlacklisted(token: String): Boolean {
        return blacklist.containsKey(token)
    }

    /**
     * 사용자의 모든 토큰을 Blacklist에 추가
     *
     * 사용 시나리오:
     * - 계정 탈취 확실시
     * - 비밀번호 변경 시 모든 세션 무효화
     * - 의심스러운 로그인 감지
     */
    fun blacklistAllUserTokens(userEmail: String) {
        logger.warn("🚨 사용자의 모든 토큰 무효화: $userEmail")
        // 실제로는 DB에서 해당 사용자의 모든 활성 토큰을 조회하여 Blacklist 추가
        // 여기서는 간략화
    }

    /**
     * 만료된 토큰을 Blacklist에서 제거
     *
     * 메모리 관리:
     * - 만료된 토큰은 더 이상 의미 없음
     * - 주기적으로 정리하여 메모리 절약
     *
     * Redis 사용 시:
     * - TTL로 자동 만료되므로 이 로직 불필요
     */
    private fun cleanupExpiredTokens() {
        val now = Date()
        val expiredTokens = blacklist.filter { it.value.before(now) }

        expiredTokens.keys.forEach { token ->
            blacklist.remove(token)
        }

        if (expiredTokens.isNotEmpty()) {
            logger.info("🧹 만료된 Blacklist 토큰 정리: ${expiredTokens.size}개")
        }
    }

    /**
     * Blacklist 전체 크기 확인 (모니터링용)
     */
    fun getBlacklistSize(): Int {
        return blacklist.size
    }

    /**
     * Blacklist 초기화 (테스트용)
     */
    fun clearBlacklist() {
        blacklist.clear()
        logger.warn("⚠️ Blacklist가 초기화되었습니다")
    }
}
