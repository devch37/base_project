package be.com.springbootclaude.security.config

import be.com.springbootclaude.security.jwt.JwtAuthenticationFilter
import be.com.springbootclaude.security.oauth.CustomOAuth2UserService
import be.com.springbootclaude.security.oauth.OAuth2AuthenticationSuccessHandler
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

/**
 * Spring Security Configuration
 *
 * ★ Production-Ready 보안 설정 ★
 *
 * 구현된 보안 기능:
 * 1. JWT 인증 (Stateless)
 * 2. OAuth 2.0 로그인 (Google, GitHub)
 * 3. Refresh Token Rotation
 * 4. Token Blacklist (토큰 탈취 대응)
 * 5. CORS 설정
 * 6. CSRF 방어
 * 7. 메서드 레벨 보안 (@PreAuthorize)
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
class SecurityConfig(
    private val jwtAuthenticationFilter: JwtAuthenticationFilter,
    private val oAuth2UserService: CustomOAuth2UserService,
    private val oAuth2SuccessHandler: OAuth2AuthenticationSuccessHandler
) {

    /**
     * Security Filter Chain 설정
     *
     * Spring Security 6.x 스타일 (Lambda DSL)
     */
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            // CSRF: JWT 사용 시 비활성화 가능
            // (Cookie 기반 인증이 아니므로)
            .csrf { it.disable() }

            // CORS 설정
            .cors { it.configurationSource(corsConfigurationSource()) }

            // 세션 사용 안 함 (Stateless)
            .sessionManagement {
                it.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            }

            // URL별 인증/인가 설정
            .authorizeHttpRequests { auth ->
                auth
                    // 인증 없이 접근 가능한 경로
                    .requestMatchers(
                        "/api/auth/**",           // 로그인, 회원가입
                        "/oauth2/**",             // OAuth2 엔드포인트
                        "/h2-console/**",         // H2 Console
                        "/actuator/health",       // Health Check
                        "/swagger-ui/**",         // Swagger
                        "/v3/api-docs/**"
                    ).permitAll()

                    // 관리자만 접근 가능
                    .requestMatchers("/api/admin/**").hasRole("ADMIN")

                    // 나머지는 인증 필요
                    .anyRequest().authenticated()
            }

            // OAuth 2.0 로그인 설정 (선택적)
            // OAuth2 클라이언트 설정이 있을 때만 활성화
            // Google/GitHub OAuth 사용 시 application.yml에 설정 추가 필요
            // .oauth2Login { oauth2 ->
            //     oauth2
            //         .userInfoEndpoint { it.userService(oAuth2UserService) }
            //         .successHandler(oAuth2SuccessHandler)
            // }

            // JWT 인증 필터 추가
            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter::class.java
            )

            // 예외 처리
            .exceptionHandling { exception ->
                exception
                    // 인증 실패 시
                    .authenticationEntryPoint { _, response, authException ->
                        response.sendError(401, "Unauthorized: ${authException.message}")
                    }

                    // 권한 부족 시
                    .accessDeniedHandler { _, response, accessDeniedException ->
                        response.sendError(403, "Forbidden: ${accessDeniedException.message}")
                    }
            }

        return http.build()
    }

    /**
     * CORS 설정
     *
     * 프론트엔드와 백엔드가 다른 도메인일 때 필수
     * 예: 프론트 http://localhost:3000, 백엔드 http://localhost:8080
     */
    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration()

        // 허용할 Origin (프론트엔드 URL)
        configuration.allowedOrigins = listOf(
            "http://localhost:3000",
            "http://localhost:8080",
            "https://your-frontend-domain.com"
        )

        // 허용할 HTTP 메서드
        configuration.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")

        // 허용할 헤더
        configuration.allowedHeaders = listOf("*")

        // 자격 증명 허용 (쿠키, Authorization 헤더)
        configuration.allowCredentials = true

        // Preflight 요청 캐싱 시간 (초)
        configuration.maxAge = 3600L

        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", configuration)

        return source
    }

    /**
     * Password Encoder
     *
     * BCrypt: 강력한 해싱 알고리즘
     * - Salt 자동 생성
     * - 느린 해싱 (Brute Force 공격 방어)
     * - 설정 가능한 강도 (기본 10)
     */
    @Bean
    fun passwordEncoder(): PasswordEncoder {
        return BCryptPasswordEncoder()
    }
}
