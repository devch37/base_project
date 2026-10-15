package tutor.chat.secure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static tutor.chat.secure.SecureStompClient.next;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * 12장: "사용자 × 방 × 역할" 접근 제어가 STOMP 프레임 단위로 지켜지는지 실제 연결로 확인한다.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "chat.expiry-sweep-interval=200ms")
class SecureStompTest {

    @TestConfiguration
    static class Clocks {
        @Bean
        @Primary
        MutableClock mutableClock() {
            return new MutableClock();
        }
    }

    @LocalServerPort int port;
    @Autowired TestRestTemplate rest;
    @Autowired MutableClock clock;

    // ── 고객사 백엔드 흉내 (X-Api-Key 로 내부 API 호출) ──────────────────
    @SuppressWarnings("unchecked")
    Map<String, Object> internal(String apiKey, HttpMethod method, String path, Object body) {
        HttpHeaders h = new HttpHeaders();
        h.set("X-Api-Key", apiKey);
        ResponseEntity<Map> r = rest.exchange(path, method, new HttpEntity<>(body, h), Map.class);
        return (Map<String, Object>) r.getBody();
    }

    String createRoom(String customerId) {
        return (String) internal("dev-acme-key", HttpMethod.POST, "/internal/rooms", Map.of("customerId", customerId)).get("roomId");
    }

    String customerToken(String customerId, String roomId) {
        return (String) internal("dev-acme-key", HttpMethod.POST, "/internal/tokens",
                Map.of("userId", customerId, "role", "CUSTOMER", "roomId", roomId)).get("token");
    }

    String agentToken(String agentId) {
        return (String) internal("dev-acme-key", HttpMethod.POST, "/internal/tokens",
                Map.of("userId", agentId, "role", "AGENT")).get("token");
    }

    void assign(String roomId, String agentId) {
        internal("dev-acme-key", HttpMethod.POST, "/internal/rooms/" + roomId + "/agents", Map.of("agentId", agentId));
    }

    // ── 내부 API ────────────────────────────────────────────────────────

    @Test
    void API키가_틀리면_401() {
        HttpHeaders h = new HttpHeaders();
        h.set("X-Api-Key", "wrong");
        var r = rest.exchange("/internal/rooms", HttpMethod.POST, new HttpEntity<>(Map.of("customerId", "c"), h), String.class);
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void 다른_고객사의_방은_보이지_않는다() {
        String acmeRoom = createRoom("c-1");
        HttpHeaders h = new HttpHeaders();
        h.set("X-Api-Key", "dev-shop-key");
        var r = rest.exchange("/internal/tokens", HttpMethod.POST,
                new HttpEntity<>(Map.of("userId", "c-1", "role", "CUSTOMER", "roomId", acmeRoom), h), String.class);
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    // ── 인증(CONNECT) ───────────────────────────────────────────────────

    @Test
    void 토큰_없이_CONNECT하면_연결이_거부된다() {
        assertThatThrownBy(() -> SecureStompClient.connect(port, null)).isNotNull();
    }

    @Test
    void 위조된_토큰으로_CONNECT하면_연결이_거부된다() {
        String room = createRoom("c-x");
        String token = customerToken("c-x", room);
        String forged = token.substring(0, token.length() - 4) + "AAAA";
        assertThatThrownBy(() -> SecureStompClient.connect(port, forged)).isNotNull();
    }

    // ── 인가(SUBSCRIBE / SEND) ──────────────────────────────────────────

    @Test
    void 고객은_자기_방만_구독하고_보낼_수_있다() throws Exception {
        String myRoom = createRoom("c-2");
        String otherRoom = createRoom("c-3");
        var c = SecureStompClient.connect(port, customerToken("c-2", myRoom));

        var q = c.subscribe("/topic/rooms/" + myRoom);
        Thread.sleep(200);
        c.session.send("/app/rooms/" + myRoom + "/send", Map.of("text", "안녕", "from", "상담사인척"));
        Map<String, Object> m = next(q);
        assertThat(m.get("text")).isEqualTo("안녕");
        assertThat(m.get("from")).as("본문의 from 은 무시하고 토큰의 사용자를 쓴다").isEqualTo("c-2");

        c.subscribe("/topic/rooms/" + otherRoom);
        assertThat(c.nextError()).contains("권한이 없습니다");
        // 중요: STOMP 규약상 ERROR 프레임 뒤에는 연결이 닫힌다. "구독 하나 거부"가 "연결 전체 종료"가 된다.
        // → 클라이언트는 권한 없는 주소를 애초에 구독하지 않도록 설계해야 한다 (12장 함정).
        assertThat(c.awaitDisconnected(3000)).isTrue();
    }

    @Test
    void topic으로_직접_SEND해서_컨트롤러를_우회할_수_없다() throws Exception {
        String room = createRoom("c-4");
        var c = SecureStompClient.connect(port, customerToken("c-4", room));
        c.session.send("/topic/rooms/" + room, Map.of("text", "가짜 공지"));
        assertThat(c.nextError()).contains("보낼 수 없는 주소");
    }

    @Test
    void 상담사는_배정된_방만_볼_수_있고_배정이_풀리면_연결이_끊긴다() throws Exception {
        String room = createRoom("c-5");
        var agent = SecureStompClient.connect(port, agentToken("agent-1"));
        agent.subscribe("/topic/rooms/" + room);
        assertThat(agent.nextError()).contains("권한이 없습니다");

        assign(room, "agent-1");
        var agent2 = SecureStompClient.connect(port, agentToken("agent-1"));
        var q = agent2.subscribe("/topic/rooms/" + room);
        Thread.sleep(200);
        var customer = SecureStompClient.connect(port, customerToken("c-5", room));
        customer.session.send("/app/rooms/" + room + "/send", Map.of("text", "도와주세요"));
        assertThat(next(q).get("text")).isEqualTo("도와주세요");

        // 배정 해제 → 이미 구독 중인 연결이 계속 엿들으면 안 된다 → 서버가 끊는다
        internal("dev-acme-key", HttpMethod.DELETE, "/internal/rooms/" + room + "/agents/agent-1", null);
        assertThat(agent2.awaitDisconnected(3000)).isTrue();
    }

    @Test
    void 고객은_상담을_종료할_수_없다_상담사는_가능() throws Exception {
        String room = createRoom("c-6");
        assign(room, "agent-2");
        var customer = SecureStompClient.connect(port, customerToken("c-6", room));
        customer.session.send("/app/rooms/" + room + "/close", Map.of());
        assertThat(customer.nextError()).contains("CLOSE 권한이 없습니다");

        var agent = SecureStompClient.connect(port, agentToken("agent-2"));
        var q = agent.subscribe("/topic/rooms/" + room);
        Thread.sleep(200);
        agent.session.send("/app/rooms/" + room + "/close", Map.of());
        assertThat(next(q).get("type")).isEqualTo("closed");
    }

    // ── 토큰 만료 vs 이미 열린 연결 ─────────────────────────────────────

    @Test
    void 토큰이_만료되면_조용히_구독만_하던_연결도_서버가_끊는다() throws Exception {
        String room = createRoom("c-7");
        var c = SecureStompClient.connect(port, customerToken("c-7", room));
        c.subscribe("/topic/rooms/" + room);
        Thread.sleep(300);
        assertThat(c.session.isConnected()).isTrue();

        clock.advance(Duration.ofMinutes(16)); // 기본 TTL 15분 경과
        assertThat(c.awaitDisconnected(3000)).as("sweeper 가 4001 로 끊어야 한다").isTrue();
    }

    @Test
    void 만료_전에_토큰을_갱신하면_연결이_유지된다() throws Exception {
        String room = createRoom("c-8");
        var c = SecureStompClient.connect(port, customerToken("c-8", room));
        var tokenQueue = c.subscribe("/user/queue/token");
        var q = c.subscribe("/topic/rooms/" + room);
        Thread.sleep(200);

        clock.advance(Duration.ofMinutes(10));
        c.session.send("/app/token/refresh", Map.of("token", customerToken("c-8", room))); // 새 토큰(지금부터 15분)
        assertThat(next(tokenQueue).get("expiresAt")).isNotNull();

        clock.advance(Duration.ofMinutes(10)); // 처음 토큰이었다면 만료됐을 시각
        Thread.sleep(500);
        assertThat(c.session.isConnected()).isTrue();
        c.session.send("/app/rooms/" + room + "/send", Map.of("text", "아직 연결됨"));
        Map<String, Object> m;
        do {
            m = q.poll(3, TimeUnit.SECONDS);
        } while (m != null && !"아직 연결됨".equals(m.get("text")));
        assertThat(m).isNotNull();
    }

    @Test
    void 남의_토큰으로는_갱신할_수_없다() throws Exception {
        String room = createRoom("c-9");
        String otherRoom = createRoom("c-10");
        var c = SecureStompClient.connect(port, customerToken("c-9", room));
        var errors = c.subscribe("/user/queue/errors");
        Thread.sleep(200);
        c.session.send("/app/token/refresh", Map.of("token", customerToken("c-10", otherRoom)));
        assertThat(next(errors).get("error")).isEqualTo("갱신 실패: 다른 사용자의 토큰");
    }

    // ── 10장 데모: 세션 vs 토큰 ─────────────────────────────────────────

    @Test
    void 토큰_방식_me는_Authorization_헤더만으로_동작한다() {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(agentToken("agent-9"));
        var r = rest.exchange("/demo/token/me", HttpMethod.GET, new HttpEntity<>(h), Map.class);
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(r.getBody().get("userId")).isEqualTo("agent-9");

        var noToken = rest.getForEntity("/demo/token/me", Map.class);
        assertThat(noToken.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(noToken.getHeaders().getFirst("WWW-Authenticate")).isEqualTo("Bearer");
    }
}
