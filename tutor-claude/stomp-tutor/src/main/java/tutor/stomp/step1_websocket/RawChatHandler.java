package tutor.stomp.step1_websocket;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

/**
 * [1단계] 순수 WebSocket 으로 만든 "전체 채팅".
 *
 * WebSocket 은 "열려 있는 양방향 관"일 뿐이다. 그래서 아래를 전부 우리가 직접 해야 한다:
 *  - 접속자 목록 관리 (sessions)
 *  - 누구에게 보낼지 결정 (지금은 무조건 전원)
 *  - 메시지 형식 정하기 (지금은 그냥 문자열)
 *  - "방" 기능을 넣으려면? → 방별 목록 Map 을 또 직접 만들어야 한다
 * 이 "직접 해야 하는 일"을 표준으로 정리해 준 것이 2단계의 STOMP 다.
 */
@Component
public class RawChatHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(RawChatHandler.class);

    /**
     * 현재 접속 중인 연결들.
     * static 이 아니어도 되는 이유: 이 클래스는 Spring Bean(@Component)이고 Bean 은 앱 전체에 1개뿐이다.
     * ConcurrentHashMap 기반인 이유: 여러 사용자의 메시지를 여러 스레드가 동시에 처리하기 때문.
     */
    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();

    @Override
    public void afterConnectionEstablished(@NonNull WebSocketSession session) throws IOException {
        sessions.add(session);
        log.info("[raw] 연결됨 id={} (현재 {}명)", session.getId(), sessions.size());
        // 서버가 "먼저" 말할 수 있다 — HTTP 로는 불가능한 일
        session.sendMessage(new TextMessage("[서버] 환영합니다. 현재 " + sessions.size() + "명 접속"));
    }

    @Override
    protected void handleTextMessage(WebSocketSession from, TextMessage message) {
        String text = "[" + from.getId().substring(0, 4) + "] " + message.getPayload();
        for (WebSocketSession s : sessions) {
            // 주의: WebSocketSession.sendMessage 는 여러 스레드가 동시에 부르면 안전하지 않다.
            // 실습이라 synchronized 로 간단히 막는다. (STOMP 를 쓰면 Spring 이 알아서 처리해 준다)
            synchronized (s) {
                try {
                    if (s.isOpen()) s.sendMessage(new TextMessage(text));
                } catch (IOException e) {
                    log.debug("전송 실패 {}", s.getId());
                }
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        // 1000: 정상 종료, 1001: 탭 닫힘, 1006: 네트워크가 갑자기 끊김
        log.info("[raw] 끊김 id={} code={} (현재 {}명)", session.getId(), status.getCode(), sessions.size());
    }
}
