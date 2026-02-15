package be.com.springbootclaude.security.oauth

import be.com.springbootclaude.security.jwt.JwtTokenProvider
import be.com.springbootclaude.security.service.RefreshTokenService
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.Authentication
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler
import org.springframework.stereotype.Component
import org.springframework.web.util.UriComponentsBuilder

/**
 * OAuth2 인증 성공 핸들러
 *
 * OAuth 로그인 성공 후 동작:
 * 1. JWT Access Token 발급
 * 2. Refresh Token 발급 및 DB 저장
 * 3. 프론트엔드로 리다이렉트 (토큰 전달)
 */
@Component
class OAuth2AuthenticationSuccessHandler(
    private val jwtTokenProvider: JwtTokenProvider,
    private val refreshTokenService: RefreshTokenService,
    @Value("\${app.oauth2.redirect-uri:http://localhost:3000/oauth/redirect}")
    private val redirectUri: String
) : SimpleUrlAuthenticationSuccessHandler() {

    private val logger = LoggerFactory.getLogger(javaClass)

    override fun onAuthenticationSuccess(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authentication: Authentication
    ) {
        val oAuth2User = authentication.principal as OAuth2User

        // 1. JWT 토큰 발급
        val accessToken = jwtTokenProvider.createAccessToken(authentication)
        val refreshToken = jwtTokenProvider.createRefreshToken(authentication)

        // 2. Refresh Token DB에 저장
        val email = oAuth2User.attributes["email"] as? String ?: "unknown"
        refreshTokenService.createRefreshToken(email, refreshToken, request)

        logger.info("✅ OAuth2 로그인 성공: email=$email")

        // 3. 프론트엔드로 리다이렉트 (토큰 전달)
        val targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
            .queryParam("accessToken", accessToken)
            .queryParam("refreshToken", refreshToken)
            .build()
            .toUriString()

        redirectStrategy.sendRedirect(request, response, targetUrl)
    }
}
