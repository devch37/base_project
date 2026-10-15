package tutor.chat.secure;

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
import tutor.chat.secure.auth.SessionRegistry;
import tutor.chat.secure.auth.StompAuthInterceptor;

/**
 * 08장 설정 + 보안 장치 두 개:
 * <ol>
 *   <li>clientInboundChannel 인터셉터 — STOMP 프레임 단위 인증·인가</li>
 *   <li>WebSocket 핸들러 데코레이터 — 서버가 소켓을 직접 닫을 수 있도록 세션 수집</li>
 * </ol>
 */
@Configuration
@EnableWebSocketMessageBroker
public class StompConfig implements WebSocketMessageBrokerConfigurer {

    private final StompAuthInterceptor authInterceptor;
    private final SessionRegistry sessionRegistry;
    private final String[] allowedOrigins;
    private final long heartbeatMs;

    public StompConfig(StompAuthInterceptor authInterceptor, SessionRegistry sessionRegistry,
                       @Value("${chat.allowed-origins}") String[] allowedOrigins,
                       @Value("${chat.heartbeat-ms}") long heartbeatMs) {
        this.authInterceptor = authInterceptor;
        this.sessionRegistry = sessionRegistry;
        this.allowedOrigins = allowedOrigins;
        this.heartbeatMs = heartbeatMs;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOriginPatterns(allowedOrigins);
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
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authInterceptor);
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        registration.addDecoratorFactory(handler -> new WebSocketHandlerDecorator(handler) {
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
