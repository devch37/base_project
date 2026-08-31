package com.example.postgrestutorial.sso;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

class ClaimPathTest {

    @Test
    void readsNestedKeycloakStyleRoleClaim() {
        Map<String, Object> claims = Map.of(
                "realm_access", Map.of("roles", List.of("admin", "user"))
        );

        assertThat(ClaimPath.read(claims, "realm_access.roles"))
                .contains(List.of("admin", "user"));
    }

    @Test
    void returnsEmptyWhenClaimDoesNotExist() {
        assertThat(ClaimPath.read(Map.of("roles", List.of("user")), "groups"))
                .isEmpty();
    }
}
