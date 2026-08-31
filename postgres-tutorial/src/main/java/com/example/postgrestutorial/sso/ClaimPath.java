package com.example.postgrestutorial.sso;

import java.util.Map;
import java.util.Optional;

/**
 * OIDC claim 안의 중첩된 값을 점(.) 경로로 읽는 작은 도우미입니다.
 *
 * <p>공급자마다 역할의 위치가 다릅니다. 예를 들어 Keycloak 토큰이
 * {@code {"realm_access":{"roles":["admin"]}}} 형태라면
 * {@code realm_access.roles} 경로로 역할 배열을 꺼낼 수 있습니다.</p>
 */
final class ClaimPath {

    private ClaimPath() {
    }

    static Optional<Object> read(Map<String, Object> claims, String path) {
        // 역할 claim을 사용하지 않도록 비워 둔 경우에는 값이 없는 것으로 처리합니다.
        if (path == null || path.isBlank()) {
            return Optional.empty();
        }

        Object current = claims;
        // "realm_access.roles"를 ["realm_access", "roles"]로 나누어 한 단계씩 내려갑니다.
        for (String segment : path.split("\\.")) {
            if (!(current instanceof Map<?, ?> currentMap) || !currentMap.containsKey(segment)) {
                // IdP 설정과 claim 경로가 다르더라도 로그인 전체를 실패시키지 않고 역할 없음으로 처리합니다.
                return Optional.empty();
            }
            current = currentMap.get(segment);
        }
        return Optional.ofNullable(current);
    }
}
