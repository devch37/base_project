package tutor.chat.cobrowse.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.IOException;
import java.security.Principal;
import java.time.Clock;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;
import tutor.chat.cobrowse.auth.ChatPrincipal;
import tutor.chat.cobrowse.auth.InvalidTokenException;
import tutor.chat.cobrowse.auth.JwtService;
import tutor.chat.cobrowse.auth.SessionRegistry;
import tutor.chat.cobrowse.relay.MessageRelay;
import tutor.chat.cobrowse.room.RoomInfo;
import tutor.chat.cobrowse.room.RoomStore;

/**
 * co-browsing 메시지 처리. 권한 검사는 인터셉터가 끝냈다.
 *
 * <p>@Payload byte[] 로 받는 이유: STOMP 본문은 원래 바이트다. String 이나 객체로 받으면
 * content-type 에 따라 변환기가 개입한다. 화면 프레임은 해석 없이 "그대로 중계"하는 게 목적이므로 바이트로 받는다.
 * (@SendTo 대신 relay.publish 를 쓰는 이유는 MessageRelay 주석 참고 — 서버 여러 대 대응)
 */
@Controller
public class CobrowseController {

    /** 상담사가 보낼 수 있는 명령 종류 — 화이트리스트 (17장) */
    private static final Set<String> COMMAND_TYPES = Set.of("click", "input", "scroll", "highlight");

    private final MessageRelay relay;
    private final RoomStore rooms;
    private final JwtService jwt;
    private final SessionRegistry sessions;
    private final ObjectMapper json;
    private final Clock clock;

    public CobrowseController(MessageRelay relay, RoomStore rooms, JwtService jwt, SessionRegistry sessions,
                              ObjectMapper json, Clock clock) {
        this.relay = relay;
        this.rooms = rooms;
        this.jwt = jwt;
        this.sessions = sessions;
        this.json = json;
        this.clock = clock;
    }

    // ── 화면: 고객 → 상담사 ───────────────────────────────────────────

    /**
     * 화면 프레임 중계. 서버는 내용을 풀어 보지 않는다(압축·조각 상태 그대로).
     * 최소한의 모양 검사만: JSON 객체인가? (크기는 전송 계층이 이미 제한했다)
     */
    @MessageMapping("/cobrowse/{roomId}/frame")
    public void frame(@DestinationVariable String roomId, @Payload byte[] body) {
        if (body.length == 0 || firstNonSpace(body) != '{') throw new IllegalArgumentException("프레임은 JSON 객체여야 합니다");
        relay.publish("/topic/cobrowse/" + roomId + "/screen", body);
    }

    // ── 명령: 상담사 → 고객 ───────────────────────────────────────────

    /**
     * 원격 명령. 서버가 "누가 보냈는지(by)"와 "명령 ID"를 직접 찍는다 — 클라이언트가 주장하는 값은 덮어쓴다.
     * 고객 동의(remoteControl)는 여기서 검사한다: 거절해도 연결은 유지된다 (DefaultRoomAccessPolicy 주석).
     */
    @MessageMapping("/cobrowse/{roomId}/command")
    public void command(@DestinationVariable String roomId, @Payload byte[] body, Principal principal) throws IOException {
        RoomInfo room = rooms.find(roomId).orElseThrow(() -> new IllegalArgumentException("없는 방"));
        JsonNode node = json.readTree(body);
        if (!(node instanceof ObjectNode cmd) || !COMMAND_TYPES.contains(cmd.path("type").asText())) {
            throw new IllegalArgumentException("허용되지 않은 명령");
        }
        // "가리키기(highlight)"는 고객 화면을 바꾸지 않으므로 동의 없이 허용. 클릭·입력·스크롤은 동의 필요.
        if (!room.remoteControl() && !"highlight".equals(cmd.path("type").asText())) {
            throw new IllegalArgumentException("고객이 원격 조작을 허용하지 않았습니다");
        }
        cmd.put("by", ((ChatPrincipal) principal).userId());
        if (!cmd.hasNonNull("cmdId")) cmd.put("cmdId", UUID.randomUUID().toString());
        cmd.put("at", clock.millis());
        relay.publish("/topic/cobrowse/" + roomId + "/commands", json.writeValueAsBytes(cmd));
    }

    /** 상담사: "화면 전체를 다시 보내 주세요" (seq 공백·조각 타임아웃 등을 감지했을 때, 19장) */
    @MessageMapping("/cobrowse/{roomId}/resync")
    public void resync(@DestinationVariable String roomId, @Payload byte[] body, Principal principal) throws IOException {
        JsonNode req = body.length == 0 ? json.createObjectNode() : json.readTree(body);
        publish("/topic/cobrowse/" + roomId + "/commands", Map.of(
                "type", "resync",
                "reason", req.path("reason").asText("agent-request"),
                "by", ((ChatPrincipal) principal).userId()));
    }

    /** 고객: 원격 조작 동의/철회. 상태가 바뀌면 방 전체에 알린다. */
    @MessageMapping("/cobrowse/{roomId}/consent")
    public void consent(@DestinationVariable String roomId, @Payload byte[] body) throws IOException {
        boolean on = json.readTree(body).path("remoteControl").asBoolean(false);
        rooms.setRemoteControl(roomId, on);
        publish("/topic/rooms/" + roomId + "/status", Map.of("type", "consent", "remoteControl", on));
    }

    // ── 채팅·종료 ────────────────────────────────────────────────────

    @MessageMapping("/rooms/{roomId}/chat")
    public void chat(@DestinationVariable String roomId, @Payload byte[] body, Principal principal) throws IOException {
        String text = json.readTree(body).path("text").asText("");
        if (text.isBlank() || text.length() > 2000) throw new IllegalArgumentException("메시지는 1~2000자");
        ChatPrincipal user = (ChatPrincipal) principal;
        publish("/topic/rooms/" + roomId + "/chat", Map.of(
                "type", "chat",
                "id", UUID.randomUUID().toString(), // 클라이언트가 중복 수신을 걸러 낼 수 있게 (19장)
                "from", user.userId(),
                "role", user.role().name(),
                "text", text,
                "at", clock.millis()));
    }

    @MessageMapping("/rooms/{roomId}/close")
    public void close(@DestinationVariable String roomId, Principal principal) throws IOException {
        rooms.close(roomId);
        publish("/topic/rooms/" + roomId + "/status", Map.of("type", "closed", "by", ((ChatPrincipal) principal).userId()));
    }

    @MessageMapping("/token/refresh")
    @SendToUser(destinations = "/queue/token", broadcast = false)
    public Map<String, Object> refresh(@Payload byte[] body, Principal principal,
                                       @Header("simpSessionId") String sessionId) throws IOException {
        ChatPrincipal current = (ChatPrincipal) principal;
        ChatPrincipal next;
        try {
            next = jwt.verify(json.readTree(body).path("token").asText(""));
        } catch (InvalidTokenException e) {
            throw new IllegalArgumentException("갱신 실패: " + e.getMessage());
        }
        if (!next.getName().equals(current.getName()) || next.role() != current.role()) {
            throw new IllegalArgumentException("갱신 실패: 다른 사용자의 토큰");
        }
        sessions.refreshed(sessionId, next);
        return Map.of("expiresAt", next.expiresAt().toString());
    }

    @MessageExceptionHandler({IllegalArgumentException.class, IOException.class})
    @SendToUser(destinations = "/queue/errors", broadcast = false)
    public Map<String, String> onError(Exception e) {
        return Map.of("error", e.getMessage() == null ? "잘못된 요청" : e.getMessage());
    }

    private void publish(String destination, Map<String, ?> body) throws IOException {
        relay.publish(destination, json.writeValueAsBytes(body));
    }

    private static byte firstNonSpace(byte[] body) {
        for (byte b : body) {
            if (b != ' ' && b != '\n' && b != '\r' && b != '\t') return b;
        }
        return 0;
    }
}
