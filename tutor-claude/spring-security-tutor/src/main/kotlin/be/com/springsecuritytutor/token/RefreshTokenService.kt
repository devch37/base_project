package be.com.springsecuritytutor.token

import be.com.springsecuritytutor.security.JwtTokenProvider
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class RefreshTokenService(
    private val refreshTokenRepository: RefreshTokenRepository,
    private val tokenProvider: JwtTokenProvider
) {

    @Transactional(readOnly = true)
    fun findByToken(token: String): RefreshToken {
        return refreshTokenRepository.findByToken(token)
            ?: throw IllegalArgumentException("Refresh token not found")
    }

    @Transactional
    fun issue(userId: Long, email: String, now: Instant = Instant.now()): JwtTokenProvider.TokenWithExpiry {
        val token = tokenProvider.generateRefreshToken(userId, email, now)
        // Store refresh token server-side so it can be revoked or rotated.
        refreshTokenRepository.save(
            RefreshToken(
                token = token.token,
                userId = userId,
                expiresAt = token.expiresAt,
                createdAt = now
            )
        )
        return token
    }

    @Transactional
    fun rotate(current: RefreshToken, email: String, now: Instant = Instant.now()): JwtTokenProvider.TokenWithExpiry {
        if (!current.isActive(now)) {
            throw IllegalStateException("Refresh token is expired or revoked")
        }

        val newToken = tokenProvider.generateRefreshToken(current.userId, email, now)
        current.revokedAt = now
        current.replacedByToken = newToken.token
        refreshTokenRepository.save(current)

        // New refresh token replaces the old one. This is the standard rotation pattern.
        refreshTokenRepository.save(
            RefreshToken(
                token = newToken.token,
                userId = current.userId,
                expiresAt = newToken.expiresAt,
                createdAt = now
            )
        )

        return newToken
    }

    @Transactional
    fun revoke(token: RefreshToken, now: Instant = Instant.now()) {
        token.revokedAt = now
        refreshTokenRepository.save(token)
    }
}
