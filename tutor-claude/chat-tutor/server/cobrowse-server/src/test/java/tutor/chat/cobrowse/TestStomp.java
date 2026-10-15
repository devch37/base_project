package tutor.chat.cobrowse;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.function.Predicate;
import org.springframework.messaging.converter.ByteArrayMessageConverter;
import org.springframework.messaging.converter.CompositeMessageConverter;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

/** 테스트용 STOMP 클라이언트: 바이트 그대로 보내고/받고, ERROR 프레임을 모은다. */
class TestStomp {

    static final ObjectMapper JSON = new ObjectMapper();

    StompSession session;
    final BlockingQueue<String> errors = new LinkedBlockingQueue<>();

    static TestStomp connect(int port, String token) throws Exception {
        TestStomp c = new TestStomp();
        // 받는 쪽(클라이언트) 버퍼도 한도가 있다! 기본 8KB 라서 100KB 메시지를 받으면 클라이언트가 연결을 끊는다.
        // 크기 한도는 "보내는 쪽·중간·받는 쪽" 모두에 있다는 것을 기억하자 (18장).
        jakarta.websocket.WebSocketContainer container = jakarta.websocket.ContainerProvider.getWebSocketContainer();
        container.setDefaultMaxTextMessageBufferSize(1 << 20);
        container.setDefaultMaxBinaryMessageBufferSize(1 << 20);
        StandardWebSocketClient ws = new StandardWebSocketClient(container);
        WebSocketStompClient client = new WebSocketStompClient(ws);
        client.setInboundMessageSizeLimit(1 << 20);
        client.setMessageConverter(new CompositeMessageConverter(
                List.of(new ByteArrayMessageConverter(), new MappingJackson2MessageConverter())));
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.initialize();
        client.setTaskScheduler(scheduler);

        WebSocketHttpHeaders http = new WebSocketHttpHeaders();
        http.setOrigin("http://localhost:5173");
        StompHeaders connect = new StompHeaders();
        connect.add("Authorization", "Bearer " + token);
        c.session = client.connectAsync("ws://localhost:" + port + "/ws", http, connect, new StompSessionHandlerAdapter() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return byte[].class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                c.errors.add(String.valueOf(headers.getFirst("message")));
            }

            @Override
            public void handleException(StompSession s, StompCommand cmd, StompHeaders h, byte[] p, Throwable ex) {
                c.errors.add("exception: " + ex.getMessage());
            }
        }).get(5, TimeUnit.SECONDS);
        return c;
    }

    BlockingQueue<byte[]> subscribeRaw(String destination) {
        BlockingQueue<byte[]> q = new LinkedBlockingQueue<>();
        session.subscribe(destination, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return byte[].class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                q.add((byte[]) payload);
            }
        });
        return q;
    }

    void sendRaw(String destination, String json) {
        session.send(destination, json.getBytes(StandardCharsets.UTF_8));
    }

    @SuppressWarnings("unchecked")
    static Map<String, Object> nextJson(BlockingQueue<byte[]> q, Predicate<Map<String, Object>> filter) throws Exception {
        long until = System.currentTimeMillis() + 5000;
        while (System.currentTimeMillis() < until) {
            byte[] b = q.poll(200, TimeUnit.MILLISECONDS);
            if (b == null) continue;
            Map<String, Object> m = JSON.readValue(b, Map.class);
            if (filter.test(m)) return m;
        }
        throw new AssertionError("5초 안에 조건에 맞는 메시지가 오지 않았다");
    }

    String nextError() throws InterruptedException {
        String e = errors.poll(5, TimeUnit.SECONDS);
        assertThat(e).as("ERROR 프레임").isNotNull();
        return e;
    }

    boolean awaitDisconnected(long millis) throws InterruptedException {
        long until = System.currentTimeMillis() + millis;
        while (System.currentTimeMillis() < until) {
            if (!session.isConnected()) return true;
            Thread.sleep(50);
        }
        return false;
    }
}
