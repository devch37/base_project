package tutor.stomp.step1_websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * [1단계] 순수 WebSocket 설정.
 *
 * ws://localhost:8080/ws-raw 로 "Upgrade: websocket" 요청이 오면
 * 서버가 101 Switching Protocols 로 답하고, 그 뒤로는 RawChatHandler 가 메시지를 처리한다.
 */
@Configuration
@EnableWebSocket
public class RawWebSocketConfig implements WebSocketConfigurer {

    private final RawChatHandler handler;

    public RawWebSocketConfig(RawChatHandler handler) {
        this.handler = handler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(handler, "/ws-raw")
                // 어느 웹페이지(Origin)에서 연결을 허용할지. 실습이라 localhost 의 모든 포트 허용
                .setAllowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*");
    }
}
