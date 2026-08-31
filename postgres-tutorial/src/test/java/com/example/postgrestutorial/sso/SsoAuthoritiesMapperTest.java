package com.example.postgrestutorial.sso;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUserAuthority;

class SsoAuthoritiesMapperTest {

    @Test
    void mapsExternalRolesToSpringAuthorities() {
        OidcIdToken idToken = new OidcIdToken(
                "token-value",
                Instant.now(),
                Instant.now().plusSeconds(300),
                Map.of(
                        "sub", "user-123",
                        "realm_access", Map.of("roles", List.of("company-admin", "viewer"))
                )
        );
        var mapper = new SsoAuthoritiesMapper("realm_access.roles");

        var mapped = mapper.mapAuthorities(List.of(new OidcUserAuthority(idToken)));

        assertThat(mapped)
                .extracting(authority -> authority.getAuthority())
                .contains("ROLE_COMPANY_ADMIN", "ROLE_VIEWER");
    }
}
