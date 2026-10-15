package tutor.chat.cobrowse.auth;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;

/**
 * 이 서버(노드)에 붙은 WebSocket 연결 목록.
 *
 * <p>23장 핵심: 이것은 절대 "공유 상태"가 될 수 없다.
 * 소켓은 특정 서버 프로세스의 OS 자원이라 다른 서버가 대신 닫거나 보낼 수 없다.
 * 그래서 "사용자 강제 퇴장" 같은 명령은 클러스터 전체에 방송하고(MessageRelay.publishControl),
 * 각 노드가 "내 로컬 연결 중 해당자"를 직접 닫는다.
 */
@Component
public class SessionRegistry {

    private static final Logger log = LoggerFactory.getLogger(SessionRegistry.class);

    // 4000~4999 는 애플리케이션이 정의하는 close code. 클라이언트(transport.ts)가 이 번호로 행동을 정한다.
    /** 토큰 만료 → 새 토큰 받아 즉시 재연결 */
    public static final CloseStatus TOKEN_EXPIRED = new CloseStatus(4001, "token expired");
    /** CONNECT 인증 실패(토큰 없음·위조) → 새 토큰 받아 백오프 후 재연결 */
    public static final CloseStatus UNAUTHORIZED = new CloseStatus(4401, "unauthorized");
    /** 강제 퇴장·권한 해제 → 재연결하지 않음 */
    public static final CloseStatus KICKED = new CloseStatus(4003, "kicked");
    /** 권한 없는 주소 접근 → 재연결하지 않음 (표준 1008 Policy Violation) */
    public static final CloseStatus FORBIDDEN = CloseStatus.POLICY_VIOLATION;

    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
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

    public ChatPrincipal user(String sessionId) {
        return users.get(sessionId);
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

    /** 로컬 연결 중 해당 사용자의 것만 닫는다 */
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

    /** 24장 장애 실습용: 이 노드의 모든 연결을 끊는다 (서버가 죽는 상황 흉내) */
    public int closeAll(CloseStatus status) {
        int n = 0;
        for (String id : sessions.keySet()) {
            close(id, status);
            n++;
        }
        return n;
    }

    public int size() {
        return sessions.size();
    }
}
