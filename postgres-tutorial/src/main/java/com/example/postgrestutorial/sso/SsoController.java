package com.example.postgrestutorial.sso;

import java.time.Instant;
import java.util.List;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 로그인 결과와 관리자 권한을 눈으로 확인하기 위한 튜토리얼 API입니다.
 * SSO가 활성화된 경우에만 Bean으로 등록됩니다.
 */
@RestController
@RequestMapping("/api")
@ConditionalOnProperty(name = "tutorial.sso.enabled", havingValue = "true")
public class SsoController {

    @GetMapping("/me")
    public UserProfile me(
            @AuthenticationPrincipal OidcUser user,
            Authentication authentication) {
        // Authentication에는 기본 OIDC 권한과 SsoAuthoritiesMapper가 추가한 ROLE_* 권한이 들어 있습니다.
        List<String> authorities = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .sorted()
                .toList();

        // 토큰 원문은 노출하지 않고, 연동 확인에 필요한 안전한 claim과 시간 정보만 반환합니다.
        return new UserProfile(
                // subject(sub)는 IdP 안에서 사용자를 구별하는 안정적인 식별자입니다.
                user.getSubject(),
                user.getPreferredUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getIssuer(),
                user.getIdToken().getIssuedAt(),
                user.getIdToken().getExpiresAt(),
                authorities
        );
    }

    @GetMapping("/csrf")
    public CsrfResponse csrf(CsrfToken token) {
        // 브라우저가 POST /logout 같은 상태 변경 요청을 보낼 때 사용할 CSRF 토큰입니다.
        return new CsrfResponse(token.getHeaderName(), token.getParameterName(), token.getToken());
    }

    @GetMapping("/admin/dashboard")
    public AdminDashboard adminDashboard(@AuthenticationPrincipal OidcUser user) {
        // 이 메서드에 도달하기 전에 SecurityFilterChain이 관리자 ROLE_* 권한을 검사합니다.
        return new AdminDashboard(
                "SSO 관리자 권한 확인에 성공했습니다.",
                user.getPreferredUsername()
        );
    }

    public record UserProfile(
            String subject,
            String username,
            String name,
            String email,
            java.net.URL issuer,
            Instant issuedAt,
            Instant expiresAt,
            List<String> authorities
    ) {
    }

    public record CsrfResponse(String headerName, String parameterName, String token) {
    }

    public record AdminDashboard(String message, String username) {
    }
}
