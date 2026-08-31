package com.example.postgrestutorial.sso;

import static org.springframework.security.config.Customizer.withDefaults;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.authority.mapping.GrantedAuthoritiesMapper;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestCustomizers;
import org.springframework.security.oauth2.client.oidc.web.logout.OidcClientInitiatedLogoutSuccessHandler;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;

/**
 * OIDC SSO 로그인과 URL별 접근 권한을 정의하는 핵심 설정입니다.
 *
 * <p>브라우저 -> IdP -> callback -> 로컬 세션 생성 흐름의 대부분은 Spring Security가 처리합니다.
 * 이 클래스에서는 공개 URL, 로그인 필요 URL, 관리자 URL과 공급자별 역할 변환만 결정합니다.</p>
 */
@Configuration(proxyBeanMethods = false)
// application-sso.yml에서 tutorial.sso.enabled=true일 때만 이 설정을 사용합니다.
@ConditionalOnProperty(name = "tutorial.sso.enabled", havingValue = "true")
@EnableConfigurationProperties(SsoProperties.class)
public class SsoSecurityConfig {

    @Bean
    SecurityFilterChain ssoSecurityFilterChain(
            HttpSecurity http,
            ClientRegistrationRepository clientRegistrationRepository,
            GrantedAuthoritiesMapper ssoAuthoritiesMapper,
            SsoProperties properties) throws Exception {
        // /oauth2/authorization/corporate 요청을 IdP의 Authorization Endpoint 요청으로 변환합니다.
        // ClientRegistrationRepository에는 application-sso.yml의 corporate 설정이 들어 있습니다.
        var authorizationRequestResolver = new DefaultOAuth2AuthorizationRequestResolver(
                clientRegistrationRepository,
                "/oauth2/authorization"
        );
        // Authorization Code가 탈취되어도 verifier 없이는 토큰으로 교환하지 못하도록 PKCE를 추가합니다.
        authorizationRequestResolver.setAuthorizationRequestCustomizer(
                OAuth2AuthorizationRequestCustomizers.withPkce()
        );

        http
                .authorizeHttpRequests(authorize -> authorize
                        // 로그인 화면과 로드밸런서 health check처럼 누구나 접근해야 하는 주소입니다.
                        .requestMatchers(
                                "/", "/index.html", "/favicon.ico", "/error",
                                "/actuator/health", "/actuator/health/**"
                        ).permitAll()
                        // 관리자 API와 민감한 Actuator 정보는 IdP의 관리자 역할이 있어야 합니다.
                        .requestMatchers("/api/admin/**", "/actuator/**")
                        .hasAuthority(SsoAuthoritiesMapper.toRoleAuthority(properties.getAdminRole()))
                        // 그 밖의 API는 역할과 무관하게 SSO 로그인 자체가 필요합니다.
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        // 로그인 요청에는 위에서 만든 PKCE 적용 resolver를 사용합니다.
                        .authorizationEndpoint(endpoint -> endpoint
                                .authorizationRequestResolver(authorizationRequestResolver))
                        // 로그인 완료 후 IdP 역할 claim을 ROLE_* 권한으로 변환합니다.
                        .userInfoEndpoint(userInfo -> userInfo
                                .userAuthoritiesMapper(ssoAuthoritiesMapper))
                )
                .logout(logout -> logout
                        // 로컬 JSESSIONID뿐 아니라 IdP가 지원하면 IdP 세션 로그아웃도 요청합니다.
                        .logoutSuccessHandler(oidcLogoutSuccessHandler(clientRegistrationRepository))
                )
                // 로그인 외에 OAuth2 Client가 사용하는 공통 컴포넌트도 기본값으로 활성화합니다.
                .oauth2Client(withDefaults());

        return http.build();
    }

    @Bean
    GrantedAuthoritiesMapper ssoAuthoritiesMapper(SsoProperties properties) {
        // 공급자별 roles claim 위치를 설정에서 주입한 mapper입니다.
        return new SsoAuthoritiesMapper(properties.getRolesClaim());
    }

    private LogoutSuccessHandler oidcLogoutSuccessHandler(
            ClientRegistrationRepository clientRegistrationRepository) {
        var logoutSuccessHandler = new OidcClientInitiatedLogoutSuccessHandler(
                clientRegistrationRepository
        );
        // IdP 로그아웃이 끝나면 사용자를 현재 애플리케이션의 메인 화면으로 돌려보냅니다.
        logoutSuccessHandler.setPostLogoutRedirectUri("{baseUrl}/");
        return logoutSuccessHandler;
    }
}
