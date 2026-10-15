package tutor.chat.stomp;

import java.util.List;
import java.util.Map;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST 와 STOMP 가 한 서버에서 함께 사는 모습.
 * 예: 관리자 시스템(다른 서버)이 HTTP 로 "공지"를 보내면 → 그 방의 WebSocket 구독자들에게 실시간으로 전달.
 * 실무에서 아주 흔한 패턴이다 (주문 상태 변경 → 고객 화면에 실시간 반영 등).
 */
@RestController
@RequestMapping("/api/rooms/{roomId}")
public class NoticeRestController {

    private final SimpMessagingTemplate messaging;
    private final ChatHistory history;
    private final PresenceTracker presence;

    public NoticeRestController(SimpMessagingTemplate messaging, ChatHistory history, PresenceTracker presence) {
        this.messaging = messaging;
        this.history = history;
        this.presence = presence;
    }

    @PostMapping("/notice")
    public ChatMessage notice(@PathVariable String roomId, @RequestBody Map<String, String> body) {
        ChatMessage m = history.append(roomId, "notice", "관리자", body.getOrDefault("text", ""));
        messaging.convertAndSend("/topic/rooms/" + roomId, m);
        return m;
    }

    @GetMapping("/messages")
    public List<ChatMessage> messages(@PathVariable String roomId) {
        return history.since(roomId, 0);
    }

    @GetMapping("/presence")
    public Map<String, Object> presence(@PathVariable String roomId) {
        return Map.of("roomId", roomId, "count", presence.count(roomId));
    }
}
