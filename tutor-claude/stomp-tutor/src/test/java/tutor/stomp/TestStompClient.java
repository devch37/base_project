package tutor.stomp;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

/** 테스트용 STOMP 클라이언트 — 브라우저의 stompjs 가 하는 일을 Java 로 */
class TestStompClient {

    static final ObjectMapper JSON = new ObjectMapper();
    final StompSession session;

    TestStompClient(int port) throws Exception {
        WebSocketStompClient client = new WebSocketStompClient(new StandardWebSocketClient());
        client.setMessageConverter(new MappingJackson2MessageConverter());
        WebSocketHttpHeaders headers = new WebSocketHttpHeaders();
        headers.setOrigin("http://localhost:" + port);
        session = client.connectAsync("ws://localhost:" + port + "/ws", headers, new StompSessionHandlerAdapter() {})
                .get(5, TimeUnit.SECONDS);
    }

    /** 구독해서 받은 본문(JSON 원문)을 큐에 쌓는다 */
    BlockingQueue<String> subscribe(String destination) throws InterruptedException {
        BlockingQueue<String> q = new LinkedBlockingQueue<>();
        session.subscribe(destination, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders h) {
                return byte[].class;
            }

            @Override
            public void handleFrame(StompHeaders h, Object payload) {
                q.add(new String((byte[]) payload, java.nio.charset.StandardCharsets.UTF_8));
            }
        });
        Thread.sleep(200); // SUBSCRIBE 가 서버에 도착할 시간 (SUBSCRIBE 에는 기본적으로 응답이 없다)
        return q;
    }

    void send(String roomId, String sender, String text) {
        session.send("/app/rooms/" + roomId + "/send", Map.of("sender", sender, "text", text));
    }

    @SuppressWarnings("unchecked")
    static Map<String, Object> nextMessage(BlockingQueue<String> q) throws Exception {
        String body = q.poll(5, TimeUnit.SECONDS);
        if (body == null) throw new AssertionError("5초 안에 메시지가 오지 않았다");
        return JSON.readValue(body, Map.class);
    }
}
