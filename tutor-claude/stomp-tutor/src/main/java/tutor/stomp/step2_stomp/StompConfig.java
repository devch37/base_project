package tutor.stomp.step2_stomp;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * [2단계] STOMP 설정 — "주소 체계"를 정한다.
 *
 * <pre>
 *  브라우저 ── SEND /app/rooms/r1/send ──▶ ChatController (@MessageMapping)
 *                                              │ broadcaster.send(...)
 *                                              ▼
 *  브라우저 ◀── MESSAGE ─── 브로커 ◀── /topic/rooms/r1 로 보냄
 *  (SUBSCRIBE /topic/rooms/r1 해 둔 사람 전원)
 * </pre>
 *
 * /app   으로 시작하는 주소 → 우리 컨트롤러가 먼저 받는다 (검증·가공 가능)
 * /topic 으로 시작하는 주소 → 브로커가 구독자 전원에게 뿌린다
 */
@Configuration
@EnableWebSocketMessageBroker
public class StompConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 브라우저는 ws://localhost:8080/ws 로 WebSocket 을 연 뒤, 그 위에서 STOMP 프레임을 주고받는다
        registry.addEndpoint("/ws").setAllowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*");
        // ★ 함정: Spring 은 기본적으로 "한 사람이 보낸 메시지들"도 여러 스레드로 동시에 처리한다.
        //   철수가 "하나, 둘, 셋"을 빠르게 보내면 "하나, 셋, 둘"로 처리될 수 있다 (Step2OrderTest 실측: 300개 중 119개 뒤바뀜).
        //   이 옵션을 켜면 한 연결의 메시지는 도착 순서대로 하나씩 처리한다.
        registry.setPreserveReceiveOrder(true);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 서버 메모리 안의 간단한 브로커. "누가 어느 /topic 을 구독 중인지" 목록을 들고 있다.
        // ★ 이 목록은 "이 서버" 것뿐이다 → 서버가 2대가 되면 3단계(Hazelcast)가 필요한 이유
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
        // 브로커 → 각 구독자로 "나가는" 방향도 순서대로
        registry.setPreservePublishOrder(true);
    }
}
