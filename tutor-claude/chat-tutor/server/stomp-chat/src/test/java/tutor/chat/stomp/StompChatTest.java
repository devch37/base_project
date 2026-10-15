package tutor.chat.stomp;

import static org.assertj.core.api.Assertions.assertThat;
import static tutor.chat.stomp.StompTestClient.next;
import static tutor.chat.stomp.StompTestClient.nextOfType;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.simp.stomp.StompHeaders;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class StompChatTest {

    @LocalServerPort int port;
    @Autowired TestRestTemplate rest;

    @Test
    void SEND_app은_컨트롤러를_거쳐_topic_구독자_전원에게_간다() throws Exception {
        var customer = StompTestClient.connect(port, new long[] {0, 0});
        var agent = StompTestClient.connect(port, new long[] {0, 0});
        var cq = customer.subscribe("/topic/rooms/r1");
        var aq = agent.subscribe("/topic/rooms/r1");
        Thread.sleep(200); // SUBSCRIBE 가 서버에 도착할 시간 (STOMP SUBSCRIBE 에는 기본 응답이 없다!)

        customer.session.send("/app/rooms/r1/send", Map.of("from", "고객", "text", "안녕하세요"));

        Map<String, Object> got = nextOfType(aq, "chat");
        assertThat(got.get("text")).isEqualTo("안녕하세요");
        assertThat(got.get("seq")).isNotNull(); // 서버가 붙인 순번
        assertThat(nextOfType(cq, "chat").get("text")).isEqualTo("안녕하세요"); // 보낸 사람도 받는다
    }

    @Test
    void 다른_방은_받지_않는다() throws Exception {
        var a = StompTestClient.connect(port, new long[] {0, 0});
        var other = a.subscribe("/topic/rooms/other");
        var mine = a.subscribe("/topic/rooms/mine");
        Thread.sleep(200);
        a.session.send("/app/rooms/mine/send", Map.of("from", "x", "text", "hello"));
        assertThat(nextOfType(mine, "chat").get("text")).isEqualTo("hello");
        // other 방에는 입장 시스템 메시지만 있고 chat 은 없다
        Map<String, Object> m;
        while ((m = other.poll(300, TimeUnit.MILLISECONDS)) != null) {
            assertThat(m.get("type")).isNotEqualTo("chat");
        }
    }

    @Test
    void 잘못된_메시지는_보낸_사람에게만_오류() throws Exception {
        var sender = StompTestClient.connect(port, new long[] {0, 0});
        var errors = sender.subscribe("/user/queue/errors");
        Thread.sleep(200);
        sender.session.send("/app/rooms/r2/send", Map.of("from", "고객", "text", "  "));
        assertThat(next(errors).get("error")).isEqualTo("빈 메시지는 보낼 수 없습니다");
    }

    @Test
    void SubscribeMapping으로_놓친_메시지를_받는다() throws Exception {
        var a = StompTestClient.connect(port, new long[] {0, 0});
        a.subscribe("/topic/rooms/r3");
        Thread.sleep(200);
        a.session.send("/app/rooms/r3/send", Map.of("from", "a", "text", "1번"));
        a.session.send("/app/rooms/r3/send", Map.of("from", "a", "text", "2번"));
        Thread.sleep(300);

        var late = StompTestClient.connect(port, new long[] {0, 0});
        StompHeaders h = new StompHeaders();
        h.setDestination("/app/rooms/r3/history");
        h.set("after-seq", "0");
        Map<String, Object> reply = next(late.subscribe(h));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> list = (List<Map<String, Object>>) reply.get("list");
        assertThat(list).extracting(m -> m.get("text")).contains("1번", "2번");
    }

    @Test
    void REST_로_보낸_공지가_WebSocket_구독자에게_실시간으로_간다() throws Exception {
        var a = StompTestClient.connect(port, new long[] {0, 0});
        var q = a.subscribe("/topic/rooms/r4");
        Thread.sleep(200);
        rest.postForEntity("/api/rooms/r4/notice", Map.of("text", "점검 예정"), Map.class);
        assertThat(nextOfType(q, "notice").get("text")).isEqualTo("점검 예정");
    }

    @Test
    void heartbeat는_CONNECT와_CONNECTED에서_협상된다() throws Exception {
        // 클라이언트: "나는 5초마다 보낼 수 있고, 너는 5초마다 보내 줘"
        var a = StompTestClient.connect(port, new long[] {5000, 5000});
        // 서버 설정 10초: 서버 응답 heart-beat 헤더 = [서버가 보낼 주기, 서버가 기대하는 주기]
        long[] hb = a.connected.getHeartbeat();
        assertThat(hb).containsExactly(10000, 10000);
        // 실제 주기 = max(내가 보낼 수 있는 값, 상대가 원하는 값) → 양쪽 모두 10초 (09장 표 참고)
    }

    @Test
    void 연결이_끊기면_퇴장이_방송된다() throws Exception {
        var stayer = StompTestClient.connect(port, new long[] {0, 0});
        var q = stayer.subscribe("/topic/rooms/r5");
        var leaver = StompTestClient.connect(port, new long[] {0, 0});
        leaver.subscribe("/topic/rooms/r5");
        Thread.sleep(300);
        leaver.session.disconnect();

        Map<String, Object> m;
        do {
            m = nextOfType(q, "system");
        } while (!String.valueOf(m.get("text")).startsWith("퇴장"));
        assertThat(m.get("text")).isEqualTo("퇴장 (현재 1명)");
    }
}
