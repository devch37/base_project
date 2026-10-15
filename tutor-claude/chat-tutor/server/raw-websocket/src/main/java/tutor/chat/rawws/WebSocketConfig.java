package tutor.chat.rawws;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * URL 경로 ↔ WebSocket 핸들러 연결.
 *
 * <p>ws://localhost:8080/ws/echo 로 들어온 "HTTP 요청"이 Upgrade 헤더를 달고 오면,
 * Spring 이 101 Switching Protocols 로 응답하고 그 뒤부터 같은 TCP 연결 위에서 WebSocket 프레임이 오간다.
 */
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final EchoHandler echoHandler;
    private final RoomHandler roomHandler;
    private final String[] allowedOrigins;

    public WebSocketConfig(EchoHandler echoHandler, RoomHandler roomHandler,
                           @Value("${chat.allowed-origins}") String[] allowedOrigins) {
        this.echoHandler = echoHandler;
        this.roomHandler = roomHandler;
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(echoHandler, "/ws/echo")
                .addHandler(roomHandler, "/ws/room")
                // 핸드셰이크(HTTP 단계)를 가로채 헤더를 로그로 찍는다 — 업그레이드 요청을 눈으로 보기
                .addInterceptors(new HandshakeLoggingInterceptor())
                // WebSocket 은 CORS 의 보호를 받지 않는다! 서버가 직접 Origin 을 검사해야 한다 (22장).
                // 기본값은 "같은 Origin 만 허용". 여기서는 Vite 개발 서버(5173) 등을 허용한다.
                .setAllowedOriginPatterns(allowedOrigins);
    }
}
