package tutor.chat.stomp;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

/**
 * 18장 예고: "Spring STOMP 의 메시지 한도는 64KB"라고만 알고 있으면 당한다.
 * 이 모듈은 Tomcat 버퍼를 따로 설정하지 않았으므로 기본값 8KB 가 실제 한도가 된다.
 * (cobrowse-server 는 WebSocketContainerConfig 로 이 값을 올린다)
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class MessageSizeTest {

    @LocalServerPort int port;

    @Test
    void _7KB는_통과해서_컨트롤러까지_간다() throws Exception {
        var c = StompTestClient.connect(port, new long[] {0, 0});
        var errors = c.subscribe("/user/queue/errors");
        Thread.sleep(200);
        c.session.send("/app/rooms/size/send", Map.of("from", "a", "text", "가".repeat(2300))); // UTF-8 로 약 6.9KB
        // 컨트롤러의 1000자 검증에 걸렸다 = 메시지가 서버 코드까지 도착했다
        assertThat(StompTestClient.next(errors).get("error")).isEqualTo("메시지는 1000자 이하");
        assertThat(c.session.isConnected()).isTrue();
    }

    @Test
    void _20KB는_Spring에_닿기도_전에_Tomcat이_연결을_끊는다() throws Exception {
        var c = StompTestClient.connect(port, new long[] {0, 0});
        c.session.send("/app/rooms/size/send", Map.of("from", "a", "text", "A".repeat(20_000)));
        long until = System.currentTimeMillis() + 3000;
        while (c.session.isConnected() && System.currentTimeMillis() < until) Thread.sleep(50);
        assertThat(c.session.isConnected()).as("1009 Message Too Big 으로 끊긴다").isFalse();
    }
}
