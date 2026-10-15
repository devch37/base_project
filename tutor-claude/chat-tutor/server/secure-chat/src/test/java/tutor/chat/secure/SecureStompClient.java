package tutor.chat.secure;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.lang.reflect.Type;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
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

/** ERROR 프레임과 연결 끊김까지 관찰할 수 있는 테스트용 STOMP 클라이언트 */
class SecureStompClient {

    static final ObjectMapper JSON = new ObjectMapper();

    StompSession session;
    /** 서버가 보낸 ERROR 프레임의 message 헤더 */
    final BlockingQueue<String> errors = new LinkedBlockingQueue<>();
    final CompletableFuture<Throwable> transportClosed = new CompletableFuture<>();

    /** token 이 null 이면 Authorization 헤더 없이 CONNECT */
    static SecureStompClient connect(int port, String token) throws Exception {
        SecureStompClient c = new SecureStompClient();
        WebSocketStompClient client = new WebSocketStompClient(new StandardWebSocketClient());
        client.setMessageConverter(new MappingJackson2MessageConverter());
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.initialize();
        client.setTaskScheduler(scheduler);

        WebSocketHttpHeaders http = new WebSocketHttpHeaders();
        http.setOrigin("http://localhost:5173");
        StompHeaders connect = new StompHeaders();
        if (token != null) connect.add("Authorization", "Bearer " + token);

        c.session = client.connectAsync("ws://localhost:" + port + "/ws", http, connect, new StompSessionHandlerAdapter() {
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                c.errors.add(String.valueOf(headers.getFirst("message"))); // ERROR 프레임은 여기로
            }

            @Override
            public Type getPayloadType(StompHeaders headers) {
                return byte[].class;
            }

            @Override
            public void handleException(StompSession s, StompCommand command, StompHeaders headers, byte[] payload, Throwable ex) {
                c.errors.add("exception: " + ex.getMessage());
            }

            @Override
            public void handleTransportError(StompSession s, Throwable ex) {
                c.transportClosed.complete(ex);
            }
        }).get(3, TimeUnit.SECONDS);
        return c;
    }

    BlockingQueue<Map<String, Object>> subscribe(String destination) {
        BlockingQueue<Map<String, Object>> q = new LinkedBlockingQueue<>();
        session.subscribe(destination, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return byte[].class;
            }

            @Override
            @SuppressWarnings("unchecked")
            public void handleFrame(StompHeaders headers, Object payload) {
                try {
                    q.add(JSON.readValue((byte[]) payload, Map.class));
                } catch (java.io.IOException e) {
                    throw new IllegalStateException(e);
                }
            }
        });
        return q;
    }

    String nextError() throws InterruptedException {
        String e = errors.poll(3, TimeUnit.SECONDS);
        assertThat(e).as("ERROR 프레임이 와야 한다").isNotNull();
        return e;
    }

    static Map<String, Object> next(BlockingQueue<Map<String, Object>> q) throws InterruptedException {
        Map<String, Object> m = q.poll(3, TimeUnit.SECONDS);
        assertThat(m).as("3초 안에 메시지가 와야 한다").isNotNull();
        return m;
    }

    /** 서버가 연결을 끊을 때까지 기다린다 */
    boolean awaitDisconnected(long millis) throws InterruptedException {
        long until = System.currentTimeMillis() + millis;
        while (System.currentTimeMillis() < until) {
            if (!session.isConnected()) return true;
            Thread.sleep(50);
        }
        return false;
    }
}
