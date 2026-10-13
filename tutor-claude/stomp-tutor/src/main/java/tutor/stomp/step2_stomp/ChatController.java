package tutor.stomp.step2_stomp;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;
import tutor.stomp.ServerInfo;
import tutor.stomp.step3_hazelcast.ChatBroadcaster;
import tutor.stomp.step3_hazelcast.HistoryStore;

/**
 * [2단계] STOMP 메시지 컨트롤러.
 *
 * REST 컨트롤러와 비교:
 *   @GetMapping("/api/..")          ↔  @MessageMapping("/rooms/{roomId}/send")   (앞에 /app 이 붙는다)
 *   @PathVariable                   ↔  @DestinationVariable
 *   return → "요청한 사람"에게 응답    ↔  return(@SendTo) → "구독자 전원"에게 방송
 */
@Controller
public class ChatController {

    private final ChatBroadcaster broadcaster;
    private final HistoryStore history;
    private final ServerInfo server;

    public ChatController(ChatBroadcaster broadcaster, HistoryStore history, ServerInfo server) {
        this.broadcaster = broadcaster;
        this.history = history;
        this.server = server;
    }

    /**
     * 가장 단순한 형태: return 값이 @SendTo 주소의 구독자 전원에게 간다.
     * 브라우저: SEND /app/echo  →  SUBSCRIBE /topic/echo 한 사람 모두가 받음
     */
    @MessageMapping("/echo")
    @SendTo("/topic/echo")
    public Map<String, String> echo(@Payload String text) {
        // 객체(Map·record)를 return 하면 Spring 이 JSON 으로 바꿔 보낸다 (content-type: application/json)
        return Map.of("echo", "에코: " + text);
    }

    /**
     * 방 채팅. @SendTo 대신 broadcaster 를 쓴다.
     *  - 서버 1대일 때 broadcaster = 이 서버 브로커로 바로 보냄 (@SendTo 와 똑같은 효과)
     *  - 서버 N대일 때 broadcaster = Hazelcast 로 모든 서버에 보냄 (3단계)
     * 컨트롤러는 어느 쪽인지 모른다 → 설정 하나로 바꿔 끼울 수 있다.
     */
    @MessageMapping("/rooms/{roomId}/send")
    public void send(@DestinationVariable String roomId, @Payload SendRequest request) {
        if (request.text() == null || request.text().isBlank()) return; // 빈 메시지 무시
        ChatMessage message = new ChatMessage(roomId, request.sender(), request.text(), server.port(), Instant.now());
        history.add(message);       // 최근 대화 저장 (3단계: Hazelcast IMap 이면 모든 서버가 공유)
        broadcaster.send(message);  // 방송       (3단계: Hazelcast Topic 이면 모든 서버로)
    }

    /**
     * 입장할 때 최근 대화 불러오기.
     * @SubscribeMapping: SUBSCRIBE /app/rooms/r1/history 한 "그 사람에게만" 한 번 응답한다 (요청-응답 흉내).
     */
    @SubscribeMapping("/rooms/{roomId}/history")
    public List<ChatMessage> history(@DestinationVariable String roomId) {
        return history.recent(roomId);
    }
}
