package tutor.chat.stomp;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * STOMP 의 "주소 체계"를 정하는 곳. 08장의 그림을 옆에 두고 읽자.
 *
 * <pre>
 *  클라이언트 SEND /app/rooms/r1/send ──▶ @MessageMapping("/rooms/{roomId}/send")  (우리 코드)
 *                                                   │ return 값
 *                                                   ▼
 *                                   브로커: /topic/rooms/r1 구독자 전원에게 MESSAGE
 *
 *  클라이언트 SEND /topic/rooms/r1  ──▶ (컨트롤러를 거치지 않고) 브로커가 바로 뿌림
 *                                       → 검증·권한 검사를 건너뛰게 된다! 12장에서 막는다.
 * </pre>
 *
 * <ul>
 *   <li>/app   : "애플리케이션(컨트롤러)에게" 가는 주소. 서버 코드가 먼저 받아서 처리한다.</li>
 *   <li>/topic : "브로커에게" 가는 주소. 여러 명이 구독하는 방송 채널 (1:N).</li>
 *   <li>/queue : 관례상 "한 사람"용 채널. /user/queue/errors 처럼 특정 사용자에게만 보낼 때.</li>
 * </ul>
 */
@Configuration
@EnableWebSocketMessageBroker
public class StompConfig implements WebSocketMessageBrokerConfigurer {

    private final String[] allowedOrigins;
    private final long heartbeatMs;

    public StompConfig(@Value("${chat.allowed-origins}") String[] allowedOrigins,
                       @Value("${chat.heartbeat-ms}") long heartbeatMs) {
        this.allowedOrigins = allowedOrigins;
        this.heartbeatMs = heartbeatMs;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 브라우저는 ws://host:8080/ws 로 WebSocket 을 연 뒤, 그 위에서 STOMP 프레임을 주고받는다.
        // (SockJS 폴백은 쓰지 않는다. 요즘 브라우저·프록시는 WebSocket 을 지원하고, 폴백은 디버깅을 어렵게 한다.)
        registry.addEndpoint("/ws").setAllowedOriginPatterns(allowedOrigins);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 서버 메모리 안의 간단한 브로커. 서버가 2대가 되면 서로의 구독자를 모른다 (23장).
        registry.enableSimpleBroker("/topic", "/queue")
                // heartbeat 를 쓰려면 타이머(스케줄러)가 필요하다.
                .setTaskScheduler(heartbeatScheduler())
                .setHeartbeatValue(new long[] {heartbeatMs, heartbeatMs});

        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    private ThreadPoolTaskScheduler heartbeatScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("stomp-heartbeat-");
        scheduler.initialize();
        return scheduler;
    }
}
