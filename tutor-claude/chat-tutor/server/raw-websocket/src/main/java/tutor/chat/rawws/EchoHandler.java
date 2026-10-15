package tutor.chat.rawws;

import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

/**
 * 가장 단순한 WebSocket 핸들러: 받은 텍스트를 그대로 돌려준다.
 *
 * <p>HTTP Controller 와의 결정적 차이:
 * 메서드가 "응답을 return" 하지 않는다. 대신 session 이라는 "열려 있는 연결"에 언제든 send 할 수 있다.
 * 즉 서버가 먼저 말을 걸 수 있다 (HTTP 에서는 불가능).
 */
@Component
public class EchoHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(EchoHandler.class);

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws IOException {
        log.debug("[연결] id={} remote={}", session.getId(), session.getRemoteAddress());
        // 클라이언트가 아무 말도 안 했는데 서버가 먼저 보낸다
        session.sendMessage(new TextMessage("welcome " + session.getId()));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        session.sendMessage(new TextMessage("echo: " + message.getPayload()));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        // status.getCode(): 1000 정상 종료, 1001 페이지 떠남, 1006 비정상(네트워크 끊김 — 클로즈 프레임 없이 끊김)
        log.debug("[종료] id={} code={} reason={}", session.getId(), status.getCode(), status.getReason());
    }
}
