package be.com.springbootclaude.security.jwt

import be.com.springbootclaude.security.service.TokenBlacklistService
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

/**
 * JWT Authentication Filter
 *
 * Spring Security Filter Chain에 등록되어 모든 HTTP 요청을 가로챕니다.
 *
 * 동작 순서:
 * 1. HTTP Header에서 JWT 토큰 추출
 * 2. 토큰이 Blacklist에 있는지 확인 (로그아웃/탈취 대응)
 * 3. 토큰 유효성 검증 (서명, 만료 시간)
 * 4. 유효하면 SecurityContext에 인증 정보 저장
 * 5. 다음 필터로 전달
 *
 * OncePerRequestFilter:
 * - 요청당 한 번만 실행 보장
 * - 비동기 요청에서도 안전
 */
@Component
class JwtAuthenticationFilter(
    private val jwtTokenProvider: JwtTokenProvider,
    private val tokenBlacklistService: TokenBlacklistService
) : OncePerRequestFilter() {

    private val logger = LoggerFactory.getLogger(javaClass)

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        try {
            // 1. Request에서 JWT 토큰 추출
            val token = jwtTokenProvider.resolveToken(request)

            if (token != null) {
                // 2. 토큰이 Blacklist에 있는지 확인
                if (tokenBlacklistService.isBlacklisted(token)) {
                    logger.warn("🚨 Blacklist에 등록된 토큰 사용 시도: ${request.remoteAddr}")
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token has been revoked")
                    return
                }

                // 3. 토큰 유효성 검증
                if (jwtTokenProvider.validateToken(token)) {
                    // 4. 토큰이 유효하면 Authentication 객체 생성
                    val authentication = jwtTokenProvider.getAuthentication(token)

                    // 5. SecurityContext에 저장
                    // 이후 @AuthenticationPrincipal로 사용자 정보 접근 가능
                    SecurityContextHolder.getContext().authentication = authentication

                    logger.debug("✅ 인증 성공: ${authentication.name}")

                    // 6. 의심스러운 활동 감지 (선택적)
                    detectSuspiciousActivity(request, authentication.name)
                }
            }
        } catch (ex: Exception) {
            logger.error("❌ SecurityContext에서 사용자 인증 설정 실패", ex)
        }

        // 다음 필터로 전달
        filterChain.doFilter(request, response)
    }

    /**
     * 의심스러운 활동 감지
     *
     * 보안 강화:
     * - IP 주소 급격한 변경 감지
     * - 비정상적인 요청 패턴 감지
     * - 여러 지역에서 동시 접속 감지
     *
     * 실무에서는 별도 서비스로 분리하여 더 정교하게 구현
     */
    private fun detectSuspiciousActivity(request: HttpServletRequest, userEmail: String) {
        val currentIp = request.remoteAddr
        val userAgent = request.getHeader("User-Agent")

        // 예시: IP 변경 감지 (실제로는 Redis에 이전 IP 저장 후 비교)
        // if (hasIpChangedSuspiciously(userEmail, currentIp)) {
        //     logger.warn("🚨 의심스러운 IP 변경 감지: user=$userEmail, ip=$currentIp")
        //     // 추가 인증 요구, 토큰 무효화 등
        // }
    }

    /**
     * 특정 경로는 필터 적용 제외
     * 예: Swagger, Health Check 등
     */
    override fun shouldNotFilter(request: HttpServletRequest): Boolean {
        val path = request.requestURI
        return path.startsWith("/api/auth/") ||  // 인증 엔드포인트
               path.startsWith("/actuator/") ||  // Actuator
               path.startsWith("/h2-console/") || // H2 Console
               path.startsWith("/swagger-ui/") || // Swagger
               path.startsWith("/v3/api-docs")    // API Docs
    }
}
