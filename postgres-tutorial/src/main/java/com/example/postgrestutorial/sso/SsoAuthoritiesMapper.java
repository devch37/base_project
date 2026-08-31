package com.example.postgrestutorial.sso;

import java.util.Arrays;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.authority.mapping.GrantedAuthoritiesMapper;
import org.springframework.security.oauth2.core.oidc.user.OidcUserAuthority;

/**
 * IdP가 ID Token/UserInfo에 넣어 준 외부 역할을 Spring Security 권한으로 변환합니다.
 *
 * <p>예: {@code company-admin -> ROLE_COMPANY_ADMIN}. 인증은 IdP가 끝냈지만,
 * 어떤 API를 사용할 수 있는지 결정하는 '인가'는 이 권한을 이용해 우리 시스템이 수행합니다.</p>
 */
public class SsoAuthoritiesMapper implements GrantedAuthoritiesMapper {

    // roles, groups, realm_access.roles처럼 공급자별 역할 claim 경로를 보관합니다.
    private final String rolesClaim;

    public SsoAuthoritiesMapper(String rolesClaim) {
        this.rolesClaim = rolesClaim;
    }

    @Override
    public Collection<? extends GrantedAuthority> mapAuthorities(
            Collection<? extends GrantedAuthority> authorities) {
        // OIDC_USER, SCOPE_openid 등 Spring이 기본으로 만든 권한을 잃지 않도록 먼저 복사합니다.
        Set<GrantedAuthority> mapped = new LinkedHashSet<>(authorities);

        authorities.stream()
                // 일반 권한 중 ID Token과 UserInfo claim을 가진 OIDC 권한만 선택합니다.
                .filter(OidcUserAuthority.class::isInstance)
                .map(OidcUserAuthority.class::cast)
                .map(OidcUserAuthority::getAttributes)
                // 설정한 claim 경로에서 외부 역할 목록을 추출합니다.
                .map(this::extractRoles)
                .flatMap(Collection::stream)
                // 외부 역할 문자열을 Spring의 ROLE_* 형식으로 바꿉니다.
                .map(SsoAuthoritiesMapper::toRoleAuthority)
                .map(SimpleGrantedAuthority::new)
                .forEach(mapped::add);

        return mapped;
    }

    private Set<String> extractRoles(Map<String, Object> claims) {
        return ClaimPath.read(claims, rolesClaim)
                .map(SsoAuthoritiesMapper::asStrings)
                .orElseGet(Set::of);
    }

    private static Set<String> asStrings(Object value) {
        // 대부분의 IdP는 roles/groups를 JSON 배열로 전달합니다.
        if (value instanceof Collection<?> collection) {
            return collection.stream()
                    .map(String::valueOf)
                    .filter(role -> !role.isBlank())
                    .collect(Collectors.toCollection(LinkedHashSet::new));
        }
        // 일부 공급자는 "ADMIN USER" 또는 "ADMIN,USER"처럼 문자열 하나로 전달할 수 있습니다.
        if (value instanceof String text) {
            return Arrays.stream(text.split("[,\\s]+"))
                    .filter(role -> !role.isBlank())
                    .collect(Collectors.toCollection(LinkedHashSet::new));
        }
        return Set.of(String.valueOf(value));
    }

    static String toRoleAuthority(String externalRole) {
        // Spring의 hasRole/hasAuthority에서 일관되게 비교할 수 있도록 문자를 정규화합니다.
        // 예: "company-admin" -> "ROLE_COMPANY_ADMIN"
        String normalized = externalRole.strip()
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
        return "ROLE_" + normalized;
    }
}
