package be.com.springsecuritytutor.security

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.Date

@Service
class JwtTokenProvider(
    private val properties: JwtProperties
) {
    private val key = Keys.hmacShaKeyFor(properties.secret.toByteArray())

    data class TokenWithExpiry(
        val token: String,
        val expiresAt: Instant
    )

    fun generateAccessToken(principal: UserPrincipal, now: Instant = Instant.now()): TokenWithExpiry {
        val expiresAt = now.plus(properties.accessTokenTtl)
        val permissions = principal.authorities
            .map { it.authority }
            .filter { it.startsWith("PERM_") }
            .distinct()

        // Access token is short-lived and contains roles/permissions for fast authorization checks.
        val token = Jwts.builder()
            .issuer(properties.issuer)
            .subject(principal.user.email)
            .claim("uid", principal.user.id)
            .claim("roles", principal.user.roles.map { it.name })
            .claim("perms", permissions)
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiresAt))
            .signWith(key)
            .compact()

        return TokenWithExpiry(token, expiresAt)
    }

    fun generateRefreshToken(userId: Long, email: String, now: Instant = Instant.now()): TokenWithExpiry {
        val expiresAt = now.plus(properties.refreshTokenTtl)
        // Refresh token is long-lived and used only for token rotation.
        val token = Jwts.builder()
            .issuer(properties.issuer)
            .subject(email)
            .claim("uid", userId)
            .claim("type", "refresh")
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiresAt))
            .signWith(key)
            .compact()

        return TokenWithExpiry(token, expiresAt)
    }

    fun getSubject(token: String): String = parseClaims(token).subject

    fun getExpiration(token: String): Instant = parseClaims(token).expiration.toInstant()

    fun getUserId(token: String): Long {
        val claims = parseClaims(token)
        return (claims["uid"] as Number).toLong()
    }

    fun isRefreshToken(token: String): Boolean {
        val claims = parseClaims(token)
        return claims["type"] == "refresh"
    }

    fun validateToken(token: String): Boolean {
        return try {
            parseClaims(token)
            true
        } catch (ex: Exception) {
            false
        }
    }

    private fun parseClaims(token: String): Claims {
        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .payload
    }
}
