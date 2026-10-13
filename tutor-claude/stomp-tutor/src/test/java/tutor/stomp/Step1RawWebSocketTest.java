package tutor.stomp;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;

/** 1단계: 순수 WebSocket — 서버가 먼저 말하고, 한 사람이 보낸 것을 전원이 받는다 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class Step1RawWebSocketTest {

    @LocalServerPort int port;

    WebSocketSession connect(BlockingQueue<String> inbox) throws Exception {
        return new StandardWebSocketClient().execute(new TextWebSocketHandler() {
            @Override
            protected void handleTextMessage(WebSocketSession s, TextMessage m) {
                inbox.add(m.getPayload());
            }
        }, "ws://localhost:" + port + "/ws-raw").get(5, TimeUnit.SECONDS);
    }

    @Test
    void 연결하면_서버가_먼저_환영하고_보낸_메시지는_전원이_받는다() throws Exception {
        BlockingQueue<String> a = new LinkedBlockingQueue<>();
        BlockingQueue<String> b = new LinkedBlockingQueue<>();
        WebSocketSession sa = connect(a);
        connect(b);
        assertThat(a.poll(5, TimeUnit.SECONDS)).startsWith("[서버] 환영합니다");
        assertThat(b.poll(5, TimeUnit.SECONDS)).startsWith("[서버] 환영합니다");

        sa.sendMessage(new TextMessage("안녕"));
        assertThat(a.poll(5, TimeUnit.SECONDS)).endsWith("안녕"); // 보낸 사람도 받는다
        assertThat(b.poll(5, TimeUnit.SECONDS)).endsWith("안녕");
    }
}
