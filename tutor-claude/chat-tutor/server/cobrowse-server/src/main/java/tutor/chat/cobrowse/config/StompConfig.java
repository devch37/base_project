package tutor.chat.cobrowse.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;
import org.springframework.web.socket.handler.WebSocketHandlerDecorator;
import tutor.chat.cobrowse.auth.SessionRegistry;
import tutor.chat.cobrowse.session.StompAuthInterceptor;

/**
 * 12장 설정 + 18장 크기 제한.
 *
 * <p>메시지 크기 제한은 "여러 겹"이다. 가장 작은 것이 실제 한도가 된다.
 * <ol>
 *   <li>Tomcat WebSocket 버퍼 (기본 8KB!) — WebSocketContainerConfig 에서 늘린다</li>
 *   <li>Spring STOMP messageSizeLimit (기본 64KB) — 여기서</li>
 *   <li>프록시(nginx 등)의 버퍼/제한 — 21장</li>
 *   <li>SDK 의 조각 크기 — 위 한도들보다 충분히 작게 (기본 32KB)</li>
 * </ol>
 */
@Configuration
@EnableWebSocketMessageBroker
public class StompConfig implements WebSocketMessageBrokerConfigurer {

    private final StompAuthInterceptor authInterceptor;
    private final SessionRegistry sessionRegistry;
    private final String[] allowedOrigins;
    private final long heartbeatMs;
    private final int maxMessageBytes;
    private final boolean preserveOrder;

    public StompConfig(StompAuthInterceptor authInterceptor, SessionRegistry sessionRegistry,
                       @Value("${chat.allowed-origins}") String[] allowedOrigins,
                       @Value("${chat.heartbeat-ms}") long heartbeatMs,
                       @Value("${chat.max-message-bytes}") int maxMessageBytes,
                       @Value("${chat.preserve-order:true}") boolean preserveOrder) {
        this.authInterceptor = authInterceptor;
        this.sessionRegistry = sessionRegistry;
        this.allowedOrigins = allowedOrigins;
        this.heartbeatMs = heartbeatMs;
        this.maxMessageBytes = maxMessageBytes;
        this.preserveOrder = preserveOrder;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOriginPatterns(allowedOrigins);
        // 19장: 한 연결에서 들어온 메시지를 "도착 순서대로" 처리한다.
        // 기본값(false)이면 clientInboundChannel 스레드 풀이 병렬로 처리해서 순서가 뒤바뀐다.
        // (OrderingTest 실측: 끄면 2000개 중 수백 개가 뒤바뀜)
        // 대가: 한 연결 안에서는 병렬성이 사라진다. 연결이 많으면 전체 처리량에는 영향이 작다.
        registry.setPreserveReceiveOrder(preserveOrder);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("stomp-heartbeat-");
        scheduler.initialize();
        registry.enableSimpleBroker("/topic", "/queue")
                .setTaskScheduler(scheduler)
                .setHeartbeatValue(new long[] {heartbeatMs, heartbeatMs});
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
        // 브로커 → 각 구독자로 "나가는" 방향의 순서도 보존 (clientOutboundChannel 도 기본은 병렬)
        registry.setPreservePublishOrder(preserveOrder);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authInterceptor);
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        registration
                .setMessageSizeLimit(maxMessageBytes)
                // 느린 클라이언트 보호: 보내기 버퍼가 이만큼 쌓이거나 이 시간 동안 못 보내면 그 연결을 끊는다.
                // (상담사 PC 가 느려도 서버 메모리가 무한히 쌓이지 않게 — 백프레셔의 가장 단순한 형태)
                .setSendBufferSizeLimit(4 * 1024 * 1024)
                .setSendTimeLimit(15_000)
                .addDecoratorFactory(handler -> new WebSocketHandlerDecorator(handler) {
                    @Override
                    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
                        sessionRegistry.opened(session);
                        super.afterConnectionEstablished(session);
                    }

                    @Override
                    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
                        sessionRegistry.closed(session.getId());
                        super.afterConnectionClosed(session, closeStatus);
                    }
                });
    }
}
