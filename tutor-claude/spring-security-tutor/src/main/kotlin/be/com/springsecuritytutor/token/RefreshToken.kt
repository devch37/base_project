package be.com.springsecuritytutor.token

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "refresh_tokens")
class RefreshToken(
    @Column(nullable = false, unique = true)
    var token: String,

    @Column(nullable = false)
    var userId: Long,

    @Column(nullable = false)
    var expiresAt: Instant,

    @Column(nullable = false)
    var createdAt: Instant = Instant.now(),

    var revokedAt: Instant? = null,

    var replacedByToken: String? = null
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0

    fun isActive(now: Instant = Instant.now()): Boolean {
        return revokedAt == null && expiresAt.isAfter(now)
    }
}
