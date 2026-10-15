package tutor.chat.rawws;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.net.URI;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;

/**
 * 07장: 실제 포트로 서버를 띄우고 진짜 WebSocket 클라이언트로 붙어 본다.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class RawWebSocketTest {

    @LocalServerPort int port;

    /** 받은 메시지를 큐에 쌓는 테스트용 클라이언트 */
    static class Inbox extends TextWebSocketHandler {
        final BlockingQueue<String> messages = new LinkedBlockingQueue<>();

        @Override
        protected void handleTextMessage(WebSocketSession session, TextMessage message) {
            messages.add(message.getPayload());
        }

        String next() throws InterruptedException {
            String m = messages.poll(3, TimeUnit.SECONDS);
            assertThat(m).as("3초 안에 메시지가 와야 한다").isNotNull();
            return m;
        }
    }

    WebSocketSession connect(String path, Inbox inbox, String origin) throws Exception {
        WebSocketHttpHeaders headers = new WebSocketHttpHeaders();
        headers.setOrigin(origin);
        return new StandardWebSocketClient()
                .execute(inbox, headers, URI.create("ws://localhost:" + port + path))
                .get(3, TimeUnit.SECONDS);
    }

    @Test
    void 서버가_먼저_말을_걸고_에코한다() throws Exception {
        Inbox inbox = new Inbox();
        WebSocketSession s = connect("/ws/echo", inbox, "http://localhost:5173");

        assertThat(inbox.next()).startsWith("welcome"); // 요청 없이 서버가 먼저 보냄 (HTTP 로는 불가능)
        s.sendMessage(new TextMessage("hi"));
        assertThat(inbox.next()).isEqualTo("echo: hi");
        s.close();
    }

    @Test
    void 같은_방의_다른_연결에게_브로드캐스트된다() throws Exception {
        Inbox customer = new Inbox();
        Inbox agent = new Inbox();
        WebSocketSession c = connect("/ws/room", customer, "http://localhost:5173");
        WebSocketSession a = connect("/ws/room", agent, "http://localhost:5173");

        c.sendMessage(new TextMessage("{\"type\":\"join\",\"roomId\":\"r1\",\"name\":\"고객\"}"));
        assertThat(customer.next()).contains("고객 님이 입장");
        a.sendMessage(new TextMessage("{\"type\":\"join\",\"roomId\":\"r1\",\"name\":\"상담사\"}"));
        assertThat(customer.next()).contains("상담사 님이 입장");
        assertThat(agent.next()).contains("상담사 님이 입장");

        c.sendMessage(new TextMessage("{\"type\":\"chat\",\"text\":\"도와주세요\"}"));
        assertThat(agent.next()).contains("\"text\":\"도와주세요\"").contains("\"from\":\"고객\"");

        c.close();
        assertThat(agent.next()).contains("고객 님이 나갔습니다");
        a.close();
    }

    @Test
    void 허용되지_않은_Origin은_핸드셰이크에서_거절된다() {
        // 브라우저가 evil.example 페이지에서 우리 서버로 WebSocket 을 열려는 상황 (22장 CSWSH)
        assertThatThrownBy(() -> connect("/ws/echo", new Inbox(), "https://evil.example"))
                .isInstanceOf(ExecutionException.class)
                .hasMessageContaining("403");
    }
}
