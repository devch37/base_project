package be.com.springsecuritytutor.security

import org.springframework.stereotype.Service
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap

@Service
class TokenBlacklistService {
    // In-memory blacklist for demo. Use Redis in real multi-instance deployments.
    private val blacklist = ConcurrentHashMap<String, Instant>()

    fun blacklist(token: String, expiresAt: Instant) {
        blacklist[token] = expiresAt
    }

    fun isBlacklisted(token: String, now: Instant = Instant.now()): Boolean {
        val expiry = blacklist[token] ?: return false
        if (expiry.isBefore(now)) {
            blacklist.remove(token)
            return false
        }
        return true
    }
}
