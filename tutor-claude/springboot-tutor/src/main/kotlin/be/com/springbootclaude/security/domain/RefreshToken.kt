package be.com.springbootclaude.security.domain

import jakarta.persistence.*
import java.time.LocalDateTime

/**
 * Refresh Token Entity
 *
 * Refresh Token을 DB에 저장하는 이유:
 * 1. 토큰 탈취 시 무효화 가능
 * 2. 사용자별 발급된 토큰 추적
 * 3. 로그아웃 시 해당 토큰 삭제
 * 4. 동시 로그인 제한 (선택적)
 *
 * 실무에서는 Redis 사용 권장:
 * - 빠른 조회 속도
 * - TTL 자동 만료
 * - 메모리 기반 저장소
 */
@Entity
@Table(
    name = "refresh_tokens",
    indexes = [
        Index(name = "idx_user_email", columnList = "userEmail"),
        Index(name = "idx_token", columnList = "token")
    ]
)
class RefreshToken(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    /**
     * 사용자 식별자 (이메일)
     */
    @Column(nullable = false)
    val userEmail: String,

    /**
     * Refresh Token 값
     */
    @Column(nullable = false, unique = true, length = 500)
    var token: String,

    /**
     * 만료 시간
     */
    @Column(nullable = false)
    val expiresAt: LocalDateTime,

    /**
     * IP 주소 (보안 강화)
     * 토큰 발급 시 IP를 저장하여 나중에 비교
     */
    @Column(length = 50)
    val ipAddress: String? = null,

    /**
     * User-Agent (보안 강화)
     * 다른 디바이스에서 토큰 사용 시 감지
     */
    @Column(length = 500)
    val userAgent: String? = null,

    /**
     * 생성 시간
     */
    @Column(nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    /**
     * 마지막 사용 시간
     * 토큰 사용 빈도 추적, 비활성 토큰 정리
     */
    @Column(nullable = false)
    var lastUsedAt: LocalDateTime = LocalDateTime.now()
) {
    /**
     * 토큰이 만료되었는지 확인
     */
    fun isExpired(): Boolean {
        return LocalDateTime.now().isAfter(expiresAt)
    }

    /**
     * 토큰 갱신 (Refresh Token Rotation)
     *
     * 보안 Best Practice:
     * - Refresh Token 사용 시마다 새로운 토큰 발급
     * - 기존 토큰은 무효화
     * - 탈취된 토큰 재사용 방지
     */
    fun rotate(newToken: String, newExpiresAt: LocalDateTime) {
        this.token = newToken
        this.lastUsedAt = LocalDateTime.now()
    }

    /**
     * 사용 기록 업데이트
     */
    fun markAsUsed() {
        this.lastUsedAt = LocalDateTime.now()
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is RefreshToken) return false
        return id != null && id == other.id
    }

    override fun hashCode(): Int {
        return id?.hashCode() ?: 0
    }
}
