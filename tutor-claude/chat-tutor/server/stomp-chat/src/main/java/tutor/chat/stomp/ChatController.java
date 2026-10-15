package tutor.chat.stomp;

import java.util.List;
import java.util.Map;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;

/**
 * STOMP 메시지 Controller.
 *
 * <p>05장 RoomController(@RestController)와 나란히 놓고 비교하자.
 * <table>
 *   <tr><th></th><th>REST Controller</th><th>STOMP 메시지 Controller</th></tr>
 *   <tr><td>매핑</td><td>@GetMapping("/api/..")</td><td>@MessageMapping("/rooms/{roomId}/send")  (앞에 /app 이 붙음)</td></tr>
 *   <tr><td>경로 변수</td><td>@PathVariable</td><td>@DestinationVariable</td></tr>
 *   <tr><td>return 값</td><td>요청한 사람에게 HTTP 응답</td><td>@SendTo 주소의 "구독자 전원"에게 MESSAGE</td></tr>
 *   <tr><td>상태 코드</td><td>200/404...</td><td>없음! 오류는 ERROR 프레임 또는 별도 채널로 직접 알려야 함</td></tr>
 *   <tr><td>실행 스레드</td><td>톰캣 요청 스레드</td><td>clientInboundChannel 스레드 풀</td></tr>
 * </table>
 */
@Controller
public class ChatController {

    private final ChatHistory history;

    public ChatController(ChatHistory history) {
        this.history = history;
    }

    /**
     * 클라이언트: SEND destination:/app/rooms/r1/send  body:{"from":"고객","text":"안녕"}
     * 결과:      /topic/rooms/r1 구독자 전원에게 ChatMessage 가 JSON 으로 간다.
     *
     * <p>주의(19장 예고): 이 메서드는 여러 스레드에서 동시에 실행될 수 있다.
     * seq 는 ChatHistory 안에서 순서대로 붙지만, "return 이후 브로커에 도착하는 순서"는
     * 스레드 경쟁에 따라 뒤바뀔 수 있다. 그래서 클라이언트는 seq 로 순서를 다시 확인한다.
     */
    @MessageMapping("/rooms/{roomId}/send")
    @SendTo("/topic/rooms/{roomId}")
    public ChatMessage send(@DestinationVariable String roomId, @Payload SendChatRequest request) {
        if (request.text() == null || request.text().isBlank()) {
            throw new IllegalArgumentException("빈 메시지는 보낼 수 없습니다");
        }
        if (request.text().length() > 1000) {
            throw new IllegalArgumentException("메시지는 1000자 이하");
        }
        return history.append(roomId, "chat", request.from(), request.text());
    }

    /**
     * @SubscribeMapping: SUBSCRIBE /app/rooms/r1/history 하면 "그 구독자에게만 한 번" 응답한다.
     * /topic 구독(계속 받기)과 달리 "요청-응답"을 STOMP 위에서 흉내 내는 방법.
     * 입장 직후 최근 대화를 불러오거나, 재연결 후 놓친 메시지를 받을 때 쓴다.
     */
    @SubscribeMapping("/rooms/{roomId}/history")
    public List<ChatMessage> history(@DestinationVariable String roomId,
                                     @Header(name = "after-seq", required = false) Long afterSeq) {
        return history.since(roomId, afterSeq == null ? 0 : afterSeq);
    }

    /**
     * 위 메서드들에서 예외가 나면 여기로 온다.
     * @SendToUser: 보낸 "그 사람"에게만 (/user/queue/errors 를 구독해 둔 경우).
     * 인증 전이라 사용자 이름이 없으면 Spring 은 세션 ID 로 대상을 찾는다.
     */
    @MessageExceptionHandler(IllegalArgumentException.class)
    @SendToUser(destinations = "/queue/errors", broadcast = false)
    public Map<String, String> onError(IllegalArgumentException e) {
        return Map.of("error", e.getMessage());
    }
}
