package be.com.springbootclaude.security.repository

import be.com.springbootclaude.security.domain.RefreshToken
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.time.LocalDateTime

interface RefreshTokenRepository : JpaRepository<RefreshToken, Long> {

    /**
     * 토큰으로 Refresh Token 조회
     */
    fun findByToken(token: String): RefreshToken?

    /**
     * 사용자 이메일로 Refresh Token 조회
     */
    fun findByUserEmail(userEmail: String): List<RefreshToken>

    /**
     * 사용자의 모든 Refresh Token 삭제 (로그아웃)
     */
    fun deleteByUserEmail(userEmail: String)

    /**
     * 만료된 Refresh Token 삭제 (배치 작업)
     */
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now")
    fun deleteExpiredTokens(now: LocalDateTime): Int

    /**
     * 특정 기간 동안 사용되지 않은 토큰 삭제
     */
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.lastUsedAt < :threshold")
    fun deleteUnusedTokens(threshold: LocalDateTime): Int
}
