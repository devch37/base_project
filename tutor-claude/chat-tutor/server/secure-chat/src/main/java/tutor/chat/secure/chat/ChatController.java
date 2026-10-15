package tutor.chat.secure.chat;

import java.security.Principal;
import java.time.Clock;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;
import tutor.chat.secure.auth.ChatPrincipal;
import tutor.chat.secure.auth.InvalidTokenException;
import tutor.chat.secure.auth.JwtService;
import tutor.chat.secure.auth.SessionRegistry;
import tutor.chat.secure.room.RoomRegistry;

/**
 * 인가는 이미 인터셉터에서 끝났다. 컨트롤러는 "업무"만 한다.
 * (인터셉터를 통과했다 = 이 방에 이 행동을 할 권한이 있다)
 */
@Controller
public class ChatController {

    private final RoomRegistry rooms;
    private final JwtService jwt;
    private final SessionRegistry sessions;
    private final Clock clock;
    private final Map<String, AtomicLong> seqs = new ConcurrentHashMap<>();

    public ChatController(RoomRegistry rooms, JwtService jwt, SessionRegistry sessions, Clock clock) {
        this.rooms = rooms;
        this.jwt = jwt;
        this.sessions = sessions;
        this.clock = clock;
    }

    @MessageMapping("/rooms/{roomId}/send")
    @SendTo("/topic/rooms/{roomId}")
    public ChatMessage send(@DestinationVariable String roomId, @Payload Map<String, String> body, Principal principal) {
        ChatPrincipal user = (ChatPrincipal) principal;
        String text = body.getOrDefault("text", "");
        if (text.isBlank()) throw new IllegalArgumentException("빈 메시지");
        return message(roomId, "chat", user, text);
    }

    @MessageMapping("/rooms/{roomId}/close")
    @SendTo("/topic/rooms/{roomId}")
    public ChatMessage close(@DestinationVariable String roomId, Principal principal) {
        rooms.close(roomId);
        return message(roomId, "closed", (ChatPrincipal) principal, "상담이 종료되었습니다");
    }

    /**
     * 토큰 갱신: 연결을 끊지 않고 새 토큰으로 만료 시각을 늘린다.
     * 새 토큰의 사용자가 지금 연결의 사용자와 같아야 한다 (남의 토큰으로 바꿔치기 금지).
     */
    @MessageMapping("/token/refresh")
    @SendToUser(destinations = "/queue/token", broadcast = false)
    public Map<String, Object> refresh(@Payload Map<String, String> body, Principal principal,
                                       @Header("simpSessionId") String sessionId) {
        ChatPrincipal current = (ChatPrincipal) principal;
        ChatPrincipal next;
        try {
            next = jwt.verify(body.get("token"));
        } catch (InvalidTokenException e) {
            throw new IllegalArgumentException("갱신 실패: " + e.getMessage());
        }
        if (!next.getName().equals(current.getName()) || next.role() != current.role()) {
            throw new IllegalArgumentException("갱신 실패: 다른 사용자의 토큰");
        }
        sessions.refreshed(sessionId, next);
        return Map.of("expiresAt", next.expiresAt().toString());
    }

    @MessageExceptionHandler(IllegalArgumentException.class)
    @SendToUser(destinations = "/queue/errors", broadcast = false)
    public Map<String, String> onError(IllegalArgumentException e) {
        return Map.of("error", e.getMessage());
    }

    private ChatMessage message(String roomId, String type, ChatPrincipal user, String text) {
        long seq = seqs.computeIfAbsent(roomId, k -> new AtomicLong()).incrementAndGet();
        return new ChatMessage(roomId, seq, type, user.userId(), user.role().name(), text, clock.instant());
    }
}
