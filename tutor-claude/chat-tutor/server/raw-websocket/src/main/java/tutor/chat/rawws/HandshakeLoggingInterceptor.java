package tutor.chat.rawws;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

/**
 * 핸드셰이크 = WebSocket 이 되기 직전의 "평범한 HTTP GET 요청".
 * 이 시점에는 아직 HTTP 이므로 헤더·쿼리스트링·쿠키를 읽을 수 있다.
 * (12장에서 인증을 어디서 할지 고민할 때 이 지점이 다시 등장한다.)
 */
public class HandshakeLoggingInterceptor implements HandshakeInterceptor {

    private static final Logger log = LoggerFactory.getLogger(HandshakeLoggingInterceptor.class);

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        var h = request.getHeaders();
        log.debug("[핸드셰이크] {} {} | Upgrade={} | Connection={} | Sec-WebSocket-Key={} | Origin={}",
                request.getMethod(), request.getURI(),
                h.getUpgrade(), h.getConnection(), h.getFirst("Sec-WebSocket-Key"), h.getOrigin());
        return true; // false 를 돌려주면 업그레이드를 거절한다
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // 여기서 response 는 이미 101 Switching Protocols 로 나간 상태
    }
}
