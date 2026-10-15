package tutor.chat.secure.auth;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;

/**
 * 서버가 "연결을 직접 끊을 수 있도록" WebSocketSession 을 보관한다.
 *
 * <p>STOMP 계층(@MessageMapping, 인터셉터)에서는 세션 ID 만 보이고 소켓 객체는 안 보인다.
 * 그래서 WebSocket 계층에 데코레이터를 끼워(StompConfig 참고) 세션 객체를 여기에 모아 둔다.
 * 쓰임새: 토큰 만료된 연결 끊기, 관리자의 강제 퇴장.
 */
@Component
public class SessionRegistry {

    private static final Logger log = LoggerFactory.getLogger(SessionRegistry.class);

    /** 애플리케이션 정의 close 코드 (4000~4999). 클라이언트가 "재연결해도 소용없음"을 구분할 수 있게 한다. */
    public static final CloseStatus TOKEN_EXPIRED = new CloseStatus(4001, "token expired");
    public static final CloseStatus KICKED = new CloseStatus(4003, "kicked");

    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    /** sessionId → 인증된 사용자 (CONNECT 성공 시 등록) */
    private final Map<String, ChatPrincipal> users = new ConcurrentHashMap<>();

    public void opened(WebSocketSession s) {
        sessions.put(s.getId(), s);
    }

    public void closed(String sessionId) {
        sessions.remove(sessionId);
        users.remove(sessionId);
    }

    public void authenticated(String sessionId, ChatPrincipal user) {
        users.put(sessionId, user);
    }

    public void refreshed(String sessionId, ChatPrincipal user) {
        users.put(sessionId, user);
    }

    public Map<String, ChatPrincipal> authenticatedUsers() {
        return users;
    }

    public void close(String sessionId, CloseStatus status) {
        WebSocketSession s = sessions.get(sessionId);
        if (s == null) return;
        try {
            s.close(status);
        } catch (IOException e) {
            log.debug("close 실패 {}: {}", sessionId, e.getMessage());
        }
    }

    /** 특정 사용자의 모든 연결 끊기 (탭 여러 개 포함) */
    public int closeUser(String tenant, String userId, CloseStatus status) {
        int n = 0;
        for (var e : users.entrySet()) {
            if (e.getValue().tenant().equals(tenant) && e.getValue().userId().equals(userId)) {
                close(e.getKey(), status);
                n++;
            }
        }
        return n;
    }
}
