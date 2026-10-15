package tutor.chat.stomp;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Type;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.web.socket.WebSocketHttpHeaders;

/**
 * 테스트용 STOMP 클라이언트. 브라우저의 @stomp/stompjs 가 하는 일을 Java 로 한다.
 * 구독한 주소별로 받은 메시지를 큐에 쌓아 두고, 테스트가 꺼내 본다.
 */
class StompTestClient {

    static final com.fasterxml.jackson.databind.ObjectMapper JSON = new com.fasterxml.jackson.databind.ObjectMapper();

    final StompSession session;
    final StompHeaders connected;

    private StompTestClient(StompSession session, StompHeaders connected) {
        this.session = session;
        this.connected = connected;
    }

    static StompTestClient connect(int port, long[] heartbeat) throws Exception {
        WebSocketStompClient client = new WebSocketStompClient(new StandardWebSocketClient());
        client.setMessageConverter(new MappingJackson2MessageConverter());
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.initialize();
        client.setTaskScheduler(scheduler);
        client.setDefaultHeartbeat(heartbeat);

        WebSocketHttpHeaders http = new WebSocketHttpHeaders();
        http.setOrigin("http://localhost:5173");

        var connectedHeaders = new java.util.concurrent.CompletableFuture<StompHeaders>();
        StompSession s = client.connectAsync("ws://localhost:" + port + "/ws", http, new StompHeaders(),
                new StompSessionHandlerAdapter() {
                    @Override
                    public void afterConnected(StompSession session, StompHeaders headers) {
                        connectedHeaders.complete(headers); // CONNECTED 프레임의 헤더
                    }
                }).get(3, TimeUnit.SECONDS);
        return new StompTestClient(s, connectedHeaders.get(3, TimeUnit.SECONDS));
    }

    /** 구독하고, 받은 메시지를 담을 큐를 돌려준다 */
    BlockingQueue<Map<String, Object>> subscribe(String destination) {
        return subscribe(new StompHeaders() {{ setDestination(destination); }});
    }

    BlockingQueue<Map<String, Object>> subscribe(StompHeaders headers) {
        BlockingQueue<Map<String, Object>> q = new LinkedBlockingQueue<>();
        session.subscribe(headers, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders h) {
                return byte[].class; // 원본 바이트로 받아서 직접 JSON 파싱 (변환기 동작에 기대지 않는다)
            }

            @Override
            @SuppressWarnings("unchecked")
            public void handleFrame(StompHeaders h, Object payload) {
                try {
                    Object parsed = JSON.readValue((byte[]) payload, Object.class); // 객체면 Map, 배열이면 List
                    if (parsed instanceof Map<?, ?> m) q.add((Map<String, Object>) m);
                    else q.add(Map.of("list", parsed));
                } catch (java.io.IOException e) {
                    throw new IllegalStateException(e);
                }
            }
        });
        return q;
    }

    static Map<String, Object> next(BlockingQueue<Map<String, Object>> q) throws InterruptedException {
        Map<String, Object> m = q.poll(3, TimeUnit.SECONDS);
        assertThat(m).as("3초 안에 메시지가 와야 한다").isNotNull();
        return m;
    }

    /** text 필드가 조건을 만족하는 메시지가 올 때까지 (입장/퇴장 시스템 메시지는 건너뛴다) */
    static Map<String, Object> nextOfType(BlockingQueue<Map<String, Object>> q, String type) throws InterruptedException {
        while (true) {
            Map<String, Object> m = next(q);
            if (type.equals(m.get("type"))) return m;
        }
    }
}
