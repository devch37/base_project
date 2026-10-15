package tutor.chat.rawws;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.PongMessage;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.ConcurrentWebSocketSessionDecorator;
import org.springframework.web.socket.handler.TextWebSocketHandler;

/**
 * 순수 WebSocket 으로 "방 채팅"을 직접 만들어 본다.
 *
 * <p>직접 해 보면 금방 깨닫는다 — WebSocket 은 "바이트/텍스트를 주고받는 관"일 뿐,
 * 아래 질문에 대한 답은 하나도 주지 않는다:
 * <ul>
 *   <li>이 메시지는 무슨 종류인가? (입장? 채팅? 나가기?)  → 우리가 "type" 필드를 발명</li>
 *   <li>누구에게 보내야 하나?                              → 우리가 rooms Map 을 직접 관리</li>
 *   <li>잘못된 메시지에 어떻게 오류를 알리나?              → 우리가 "error" 타입을 발명</li>
 *   <li>상대가 받았다는 걸 어떻게 아나?                     → 아직 방법 없음</li>
 * </ul>
 * 이 "직접 발명해야 하는 규칙"을 표준으로 정해 둔 것이 08장의 STOMP 다.
 *
 * <p>클라이언트 → 서버 메시지 (우리가 정한 규칙):
 * <pre>
 * {"type":"join","roomId":"r1","name":"고객"}
 * {"type":"chat","text":"안녕하세요"}
 * </pre>
 */
@Component
public class RoomHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(RoomHandler.class);
    static final String ROOM = "roomId";
    static final String NAME = "name";
    static final String LAST_PONG = "lastPong";

    private final ObjectMapper json;
    /** roomId → 그 방에 있는 연결들. 서버 "로컬 메모리"다 (23장에서 문제가 된다). */
    private final Map<String, Set<WebSocketSession>> rooms = new ConcurrentHashMap<>();
    /** 모든 연결 (KeepAliveTask 가 ping 을 돌릴 대상) */
    private final Set<WebSocketSession> all = ConcurrentHashMap.newKeySet();

    public RoomHandler(ObjectMapper json) {
        this.json = json;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession raw) {
        // 함정: WebSocketSession.sendMessage 는 스레드 안전하지 않다.
        // 방 브로드캐스트에서는 "여러 스레드가 같은 세션에 동시에 send" 하는 일이 반드시 생긴다
        // (A 와 B 가 동시에 말하면 두 톰캣 스레드가 C 에게 동시에 보낸다).
        // Decorator 가 내부 버퍼 + 락으로 순서대로 보내 주고, 느린 클라이언트는 한도 초과 시 끊는다.
        WebSocketSession session = new ConcurrentWebSocketSessionDecorator(raw, 5_000, 512 * 1024);
        raw.getAttributes().put("safe", session);
        raw.getAttributes().put(LAST_PONG, Instant.now());
        all.add(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession raw, TextMessage message) throws IOException {
        WebSocketSession session = safe(raw);
        JsonNode msg;
        try {
            msg = json.readTree(message.getPayload());
        } catch (IOException e) {
            send(session, Map.of("type", "error", "message", "JSON 이 아닙니다"));
            return;
        }
        switch (msg.path("type").asText()) {
            case "join" -> join(session, msg.path("roomId").asText(), msg.path("name").asText("익명"));
            case "chat" -> chat(session, msg.path("text").asText());
            default -> send(session, Map.of("type", "error", "message", "알 수 없는 type"));
        }
    }

    private void join(WebSocketSession session, String roomId, String name) throws IOException {
        if (roomId.isBlank()) {
            send(session, Map.of("type", "error", "message", "roomId 필요"));
            return;
        }
        leave(session); // 다른 방에 있었다면 먼저 나간다
        session.getAttributes().put(ROOM, roomId);
        session.getAttributes().put(NAME, name);
        rooms.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet()).add(session);
        broadcast(roomId, Map.of("type", "system", "text", name + " 님이 입장했습니다"));
    }

    private void chat(WebSocketSession session, String text) throws IOException {
        Object roomId = session.getAttributes().get(ROOM);
        if (roomId == null) {
            send(session, Map.of("type", "error", "message", "먼저 join 하세요"));
            return;
        }
        broadcast(roomId.toString(), Map.of("type", "chat", "from", session.getAttributes().get(NAME), "text", text));
    }

    private void broadcast(String roomId, Map<String, ?> payload) throws IOException {
        TextMessage out = new TextMessage(json.writeValueAsString(payload)); // 직렬화는 한 번만
        for (WebSocketSession s : rooms.getOrDefault(roomId, Set.of())) {
            if (!s.isOpen()) continue;
            try {
                s.sendMessage(out);
            } catch (IOException | IllegalStateException e) {
                // 한 명의 실패가 나머지 전송을 막으면 안 된다
                log.debug("전송 실패 session={} : {}", s.getId(), e.getMessage());
            }
        }
    }

    private void send(WebSocketSession s, Map<String, ?> payload) throws IOException {
        s.sendMessage(new TextMessage(json.writeValueAsString(payload)));
    }

    @Override
    protected void handlePongMessage(WebSocketSession raw, PongMessage message) {
        // 브라우저는 ping 프레임을 받으면 자동으로 pong 을 돌려준다 (JS 코드 불필요)
        raw.getAttributes().put(LAST_PONG, Instant.now());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession raw, CloseStatus status) throws IOException {
        WebSocketSession session = safe(raw);
        all.remove(session);
        leave(session);
    }

    private void leave(WebSocketSession session) throws IOException {
        Object roomId = session.getAttributes().remove(ROOM);
        if (roomId == null) return;
        Set<WebSocketSession> members = rooms.get(roomId.toString());
        if (members == null) return;
        members.remove(session);
        // 빈 방을 지우지 않으면 roomId 가 계속 쌓여 메모리 누수가 된다.
        rooms.computeIfPresent(roomId.toString(), (k, v) -> v.isEmpty() ? null : v);
        broadcast(roomId.toString(), Map.of("type", "system", "text", session.getAttributes().get(NAME) + " 님이 나갔습니다"));
    }

    private static WebSocketSession safe(WebSocketSession raw) {
        Object s = raw.getAttributes().get("safe");
        return s instanceof WebSocketSession ws ? ws : raw;
    }

    Set<WebSocketSession> allSessions() {
        return all;
    }

    int roomCount() {
        return rooms.size();
    }
}
