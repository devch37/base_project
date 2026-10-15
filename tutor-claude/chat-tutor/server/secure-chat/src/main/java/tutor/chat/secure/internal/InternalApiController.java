package tutor.chat.secure.internal;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tutor.chat.secure.auth.JwtService;
import tutor.chat.secure.auth.Role;
import tutor.chat.secure.auth.SessionRegistry;
import tutor.chat.secure.room.RoomRegistry;

/**
 * 고객사 백엔드만 부르는 "내부 API". 모든 요청은 ApiKeyInterceptor 를 통과해 tenant 가 정해진 상태다.
 * 고객사는 자기 tenant 의 방·사용자만 다룰 수 있다 (다른 고객사 방 ID 를 넣으면 404).
 */
@RestController
@RequestMapping("/internal")
public class InternalApiController {

    private final RoomRegistry rooms;
    private final JwtService jwt;
    private final SessionRegistry sessions;

    public InternalApiController(RoomRegistry rooms, JwtService jwt, SessionRegistry sessions) {
        this.rooms = rooms;
        this.jwt = jwt;
        this.sessions = sessions;
    }

    public record CreateRoom(@NotBlank String customerId) {}

    public record IssueToken(@NotBlank String userId, @NotNull Role role, String roomId, Long ttlSeconds) {}

    public record Assign(@NotBlank String agentId) {}

    @PostMapping("/rooms")
    public Map<String, String> createRoom(@RequestAttribute("tenant") String tenant, @Valid @RequestBody CreateRoom req) {
        var room = rooms.create(tenant, req.customerId());
        return Map.of("roomId", room.roomId());
    }

    @PostMapping("/rooms/{roomId}/agents")
    public Map<String, Object> assign(@RequestAttribute("tenant") String tenant, @PathVariable String roomId,
                                      @Valid @RequestBody Assign req) {
        ownRoom(tenant, roomId);
        return Map.of("agents", rooms.assign(roomId, req.agentId()).agents());
    }

    /**
     * 배정 해제. 레지스트리만 고치면 "이미 구독 중인" 연결은 계속 메시지를 받는다!
     * (인가 검사는 SUBSCRIBE 순간에만 했으니까) → 그 상담사의 연결을 끊어 재구독을 강제한다.
     */
    @DeleteMapping("/rooms/{roomId}/agents/{agentId}")
    public Map<String, Object> unassign(@RequestAttribute("tenant") String tenant, @PathVariable String roomId,
                                        @PathVariable String agentId) {
        ownRoom(tenant, roomId);
        rooms.unassign(roomId, agentId);
        int closed = sessions.closeUser(tenant, agentId, SessionRegistry.KICKED);
        return Map.of("closedSessions", closed);
    }

    @PostMapping("/tokens")
    public Map<String, Object> issue(@RequestAttribute("tenant") String tenant, @Valid @RequestBody IssueToken req) {
        List<String> tokenRooms = List.of();
        if (req.role() == Role.CUSTOMER) {
            if (req.roomId() == null) throw new IllegalArgumentException("CUSTOMER 토큰에는 roomId 가 필요합니다");
            var room = ownRoom(tenant, req.roomId());
            if (!room.customerId().equals(req.userId())) throw new IllegalArgumentException("그 방의 고객이 아닙니다");
            tokenRooms = List.of(req.roomId());
        }
        Duration ttl = req.ttlSeconds() == null ? null : Duration.ofSeconds(req.ttlSeconds());
        var issued = jwt.issue(req.userId(), tenant, req.role(), tokenRooms, ttl);
        return Map.of("token", issued.token(), "expiresAt", issued.expiresAt().toString(), "tokenType", "Bearer");
    }

    @PostMapping("/users/{userId}/kick")
    public Map<String, Object> kick(@RequestAttribute("tenant") String tenant, @PathVariable String userId) {
        return Map.of("closedSessions", sessions.closeUser(tenant, userId, SessionRegistry.KICKED));
    }

    private RoomRegistry.RoomInfo ownRoom(String tenant, String roomId) {
        return rooms.find(roomId)
                .filter(r -> r.tenant().equals(tenant)) // 남의 방은 "없는 것"처럼 — 존재 여부도 숨긴다
                .orElseThrow(() -> new RoomNotVisible(roomId));
    }

    static class RoomNotVisible extends RuntimeException {
        RoomNotVisible(String roomId) {
            super("방을 찾을 수 없습니다: " + roomId);
        }
    }

    @ExceptionHandler(RoomNotVisible.class)
    ProblemDetail notFound(RoomNotVisible e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ProblemDetail bad(IllegalArgumentException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, e.getMessage());
    }
}
