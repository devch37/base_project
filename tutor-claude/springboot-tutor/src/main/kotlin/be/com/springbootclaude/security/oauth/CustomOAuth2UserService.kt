package be.com.springbootclaude.security.oauth

import org.slf4j.LoggerFactory
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.stereotype.Service

/**
 * Custom OAuth2 User Service
 *
 * OAuth 2.0 로그인 흐름:
 * 1. 사용자가 "Google로 로그인" 클릭
 * 2. Google 인증 페이지로 리다이렉트
 * 3. 사용자 인증 후 Google이 코드 반환
 * 4. Spring Security가 코드로 Access Token 교환
 * 5. 이 서비스가 Google에서 사용자 정보 가져옴
 * 6. 우리 DB에 사용자 저장/업데이트
 * 7. JWT 발급
 *
 * 지원 Provider:
 * - Google
 * - GitHub
 * - Facebook
 * - Kakao, Naver (커스텀 설정 필요)
 */
@Service
class CustomOAuth2UserService : DefaultOAuth2UserService() {
    private val logger = LoggerFactory.getLogger(javaClass)

    override fun loadUser(userRequest: OAuth2UserRequest): OAuth2User {
        // 1. Provider에서 사용자 정보 가져오기
        val oAuth2User = super.loadUser(userRequest)

        // 2. Provider 정보 (google, github 등)
        val registrationId = userRequest.clientRegistration.registrationId
        val userNameAttributeName = userRequest.clientRegistration
            .providerDetails.userInfoEndpoint.userNameAttributeName

        logger.info("🔐 OAuth2 로그인: provider=$registrationId")

        // 3. Provider별 사용자 정보 추출
        val attributes = oAuth2User.attributes
        val email = extractEmail(registrationId, attributes)
        val name = extractName(registrationId, attributes)
        val profileImage = extractProfileImage(registrationId, attributes)

        logger.info("✅ OAuth2 사용자 정보: email=$email, name=$name, provider=$registrationId")

        // 4. 우리 DB에 사용자 저장/업데이트
        // val user = userService.findOrCreateOAuthUser(email, name, registrationId, profileImage)

        // 5. Spring Security용 OAuth2User 반환
        return oAuth2User
    }

    /**
     * Provider별 이메일 추출
     */
    private fun extractEmail(registrationId: String, attributes: Map<String, Any>): String {
        return when (registrationId) {
            "google" -> attributes["email"] as String
            "github" -> attributes["email"] as? String ?: "${attributes["login"]}@github.com"
            "facebook" -> attributes["email"] as String
            else -> throw IllegalArgumentException("지원하지 않는 Provider: $registrationId")
        }
    }

    /**
     * Provider별 이름 추출
     */
    private fun extractName(registrationId: String, attributes: Map<String, Any>): String {
        return when (registrationId) {
            "google" -> attributes["name"] as String
            "github" -> attributes["name"] as? String ?: attributes["login"] as String
            "facebook" -> attributes["name"] as String
            else -> "Unknown"
        }
    }

    /**
     * Provider별 프로필 이미지 추출
     */
    private fun extractProfileImage(registrationId: String, attributes: Map<String, Any>): String? {
        return when (registrationId) {
            "google" -> attributes["picture"] as? String
            "github" -> attributes["avatar_url"] as? String
            "facebook" -> {
                val picture = attributes["picture"] as? Map<*, *>
                val data = picture?.get("data") as? Map<*, *>
                data?.get("url") as? String
            }
            else -> null
        }
    }
}
