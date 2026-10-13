package tutor.stomp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * stomp-tutor: WebSocket → STOMP → Hazelcast 를 하나의 앱에서 단계별로.
 *
 * <pre>
 * step1_websocket : 순수 WebSocket (ws://localhost:8080/ws-raw)  → 브라우저 raw.html
 * step2_stomp     : STOMP 채팅   (ws://localhost:8080/ws)       → 브라우저 chat.html
 * step3_hazelcast : 서버 2대를 묶어서 다른 서버 사용자끼리 채팅    → chat.html 을 8081, 8082 로 각각 열기
 * </pre>
 */
@SpringBootApplication
public class StompTutorApplication {
    public static void main(String[] args) {
        SpringApplication.run(StompTutorApplication.class, args);
    }
}
