package tutor.chat.cobrowse;

import java.util.Map;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.web.client.RestTemplate;

/** 고객사 백엔드 흉내: X-Api-Key 로 내부 API 를 부른다. */
class Tenant {

    private final RestTemplate rest = new RestTemplate();
    private final String base;
    private final String apiKey;

    Tenant(int port, String apiKey) {
        this.base = "http://localhost:" + port;
        this.apiKey = apiKey;
    }

    @SuppressWarnings("unchecked")
    Map<String, Object> call(HttpMethod method, String path, Object body) {
        HttpHeaders h = new HttpHeaders();
        h.set("X-Api-Key", apiKey);
        return rest.exchange(base + path, method, new HttpEntity<>(body, h), Map.class).getBody();
    }

    String createRoom(String customerId) {
        return (String) call(HttpMethod.POST, "/internal/rooms", Map.of("customerId", customerId)).get("roomId");
    }

    String customerToken(String customerId, String roomId) {
        return (String) call(HttpMethod.POST, "/internal/tokens",
                Map.of("userId", customerId, "role", "CUSTOMER", "roomId", roomId)).get("token");
    }

    String agentToken(String agentId) {
        return (String) call(HttpMethod.POST, "/internal/tokens", Map.of("userId", agentId, "role", "AGENT")).get("token");
    }

    void assign(String roomId, String agentId) {
        call(HttpMethod.POST, "/internal/rooms/" + roomId + "/agents", Map.of("agentId", agentId));
    }
}
