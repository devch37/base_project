package tutor.chat.cobrowse.internal;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Clock;
import java.time.Duration;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tutor.chat.cobrowse.auth.JwtService;
import tutor.chat.cobrowse.auth.Role;
import tutor.chat.cobrowse.auth.SessionRegistry;
import tutor.chat.cobrowse.presence.PresenceService;
import tutor.chat.cobrowse.relay.ControlEvent;
import tutor.chat.cobrowse.relay.MessageRelay;
import tutor.chat.cobrowse.room.RoomInfo;
import tutor.chat.cobrowse.room.RoomStore;

/**
 * 고객사 백엔드 전용 API (X-Api-Key). secure-chat 과 같은 모양 + 방 목록·presence·장애 실습 API.
 */
@RestController
@RequestMapping("/internal")
public class InternalApiController {

    private final RoomStore rooms;
    private final JwtService jwt;
    private final MessageRelay relay;
    private final SessionRegistry sessions;
    private final PresenceService presence;
    private final Clock clock;

    public InternalApiController(RoomStore rooms, JwtService jwt, MessageRelay relay, SessionRegistry sessions,
                                 PresenceService presence, Clock clock) {
        this.rooms = rooms;
        this.jwt = jwt;
        this.relay = relay;
        this.sessions = sessions;
        this.presence = presence;
        this.clock = clock;
    }

    public record CreateRoom(@NotBlank String customerId) {}

    public record IssueToken(@NotBlank String userId, @NotNull Role role, String roomId, Long ttlSeconds) {}

    public record Assign(@NotBlank String agentId) {}

    @PostMapping("/rooms")
    public Map<String, String> createRoom(@RequestAttribute("tenant") String tenant, @Valid @RequestBody CreateRoom req) {
        return Map.of("roomId", rooms.create(tenant, req.customerId(), clock.instant()).roomId());
    }

    @GetMapping("/rooms")
    public List<Map<String, Object>> list(@RequestAttribute("tenant") String tenant) {
        return rooms.listByTenant(tenant).stream()
                .sorted(Comparator.comparing(RoomInfo::createdAt).reversed())
                .map(r -> Map.<String, Object>of(
                        "roomId", r.roomId(), "customerId", r.customerId(), "agents", r.agents(),
                        "remoteControl", r.remoteControl(), "closed", r.closed(),
                        "createdAt", r.createdAt().toString(), "presence", presence.status(r.roomId())))
                .toList();
    }

    @PostMapping("/rooms/{roomId}/agents")
    public Map<String, Object> assign(@RequestAttribute("tenant") String tenant, @PathVariable String roomId,
                                      @Valid @RequestBody Assign req) {
        ownRoom(tenant, roomId);
        return Map.of("agents", rooms.assign(roomId, req.agentId()).agents());
    }

    @DeleteMapping("/rooms/{roomId}/agents/{agentId}")
    public Map<String, Object> unassign(@RequestAttribute("tenant") String tenant, @PathVariable String roomId,
                                        @PathVariable String agentId) {
        ownRoom(tenant, roomId);
        rooms.unassign(roomId, agentId);
        // 소켓은 각 노드만 닫을 수 있다 → 클러스터 전체에 방송
        relay.publishControl(new ControlEvent("kick", tenant, agentId));
        return Map.of("ok", true);
    }

    @PostMapping("/tokens")
    public Map<String, Object> issue(@RequestAttribute("tenant") String tenant, @Valid @RequestBody IssueToken req) {
        List<String> tokenRooms = List.of();
        if (req.role() == Role.CUSTOMER) {
            if (req.roomId() == null) throw new IllegalArgumentException("CUSTOMER 토큰에는 roomId 가 필요합니다");
            RoomInfo room = ownRoom(tenant, req.roomId());
            if (!room.customerId().equals(req.userId())) throw new IllegalArgumentException("그 방의 고객이 아닙니다");
            tokenRooms = List.of(req.roomId());
        }
        Duration ttl = req.ttlSeconds() == null ? null : Duration.ofSeconds(req.ttlSeconds());
        var issued = jwt.issue(req.userId(), tenant, req.role(), tokenRooms, ttl);
        return Map.of("token", issued.token(), "expiresAt", issued.expiresAt().toString(), "tokenType", "Bearer");
    }

    @PostMapping("/users/{userId}/kick")
    public Map<String, Object> kick(@RequestAttribute("tenant") String tenant, @PathVariable String userId) {
        relay.publishControl(new ControlEvent("kick", tenant, userId));
        return Map.of("ok", true);
    }

    /**
     * 24장 장애 실습: 이 노드의 모든 WebSocket 을 끊는다 (프로세스는 유지).
     * 1001 Going Away — 서버가 내려갈 때 쓰는 표준 코드. 클라이언트는 재연결을 시도해야 한다.
     */
    @PostMapping("/admin/drop-connections")
    public Map<String, Object> dropAll() {
        return Map.of("closed", sessions.closeAll(org.springframework.web.socket.CloseStatus.GOING_AWAY));
    }

    private RoomInfo ownRoom(String tenant, String roomId) {
        return rooms.find(roomId).filter(r -> r.tenant().equals(tenant)).orElseThrow(() -> new RoomNotVisible(roomId));
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
