package be.com.springsecuritytutor.auth

import be.com.springsecuritytutor.security.JwtTokenProvider
import be.com.springsecuritytutor.security.TokenBlacklistService
import be.com.springsecuritytutor.security.UserPrincipal
import be.com.springsecuritytutor.token.RefreshTokenService
import be.com.springsecuritytutor.user.AccountStatus
import be.com.springsecuritytutor.user.UserRepository
import be.com.springsecuritytutor.user.UserService
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class AuthService(
    private val authenticationManager: AuthenticationManager,
    private val userService: UserService,
    private val userRepository: UserRepository,
    private val tokenProvider: JwtTokenProvider,
    private val refreshTokenService: RefreshTokenService,
    private val tokenBlacklistService: TokenBlacklistService
) {

    @Transactional
    fun register(request: RegisterRequest): TokenResponse {
        // Create a new user and immediately issue tokens to avoid an extra login step.
        val user = userService.register(request.email, request.password)
        val principal = UserPrincipal(user)

        val accessToken = tokenProvider.generateAccessToken(principal)
        val refreshToken = refreshTokenService.issue(user.id, user.email)

        return TokenResponse(
            accessToken = accessToken.token,
            accessTokenExpiresAt = accessToken.expiresAt,
            refreshToken = refreshToken.token,
            refreshTokenExpiresAt = refreshToken.expiresAt
        )
    }

    @Transactional
    fun login(request: LoginRequest): TokenResponse {
        // Delegates password verification to AuthenticationManager (BCrypt + UserDetailsService).
        val authToken = UsernamePasswordAuthenticationToken(request.email, request.password)
        val authentication = authenticationManager.authenticate(authToken)

        val principal = authentication.principal as UserPrincipal
        val accessToken = tokenProvider.generateAccessToken(principal)
        val refreshToken = refreshTokenService.issue(principal.user.id, principal.user.email)

        return TokenResponse(
            accessToken = accessToken.token,
            accessTokenExpiresAt = accessToken.expiresAt,
            refreshToken = refreshToken.token,
            refreshTokenExpiresAt = refreshToken.expiresAt
        )
    }

    @Transactional
    fun refresh(request: RefreshRequest): TokenResponse {
        val rawToken = request.refreshToken
        if (!tokenProvider.validateToken(rawToken) || !tokenProvider.isRefreshToken(rawToken)) {
            throw IllegalArgumentException("Invalid refresh token")
        }

        val storedToken = refreshTokenService.findByToken(rawToken)
        if (!storedToken.isActive()) {
            throw IllegalStateException("Refresh token expired or revoked")
        }

        val user = userRepository.findById(storedToken.userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        if (user.status != AccountStatus.ACTIVE) {
            throw IllegalStateException("User is not active")
        }

        // Rotate refresh token to reduce replay risk. Old token is revoked and replaced.
        val rotatedRefreshToken = refreshTokenService.rotate(storedToken, user.email)
        val accessToken = tokenProvider.generateAccessToken(UserPrincipal(user))

        return TokenResponse(
            accessToken = accessToken.token,
            accessTokenExpiresAt = accessToken.expiresAt,
            refreshToken = rotatedRefreshToken.token,
            refreshTokenExpiresAt = rotatedRefreshToken.expiresAt
        )
    }

    @Transactional
    fun logout(refreshToken: String, accessToken: String?, now: Instant = Instant.now()) {
        val storedToken = refreshTokenService.findByToken(refreshToken)
        refreshTokenService.revoke(storedToken, now)

        if (!accessToken.isNullOrBlank() && tokenProvider.validateToken(accessToken)) {
            val expiresAt = tokenProvider.getExpiration(accessToken)
            tokenBlacklistService.blacklist(accessToken, expiresAt)
        }
    }
}
