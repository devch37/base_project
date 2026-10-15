package tutor.chat.secure.room;

import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

/**
 * 방 → (고객사, 고객, 배정된 상담사들).
 *
 * <p>토큰에 넣을 것 vs 서버에서 조회할 것 (12장):
 * 고객의 방은 상담 내내 안 바뀌므로 토큰에 넣어도 된다.
 * 상담사의 "배정"은 수시로 바뀐다(이관, 추가 배정). 토큰에 넣으면 바뀔 때마다 재발급해야 하고,
 * 배정이 해제돼도 옛 토큰으로 계속 들어올 수 있다. → 매번 서버 상태에서 조회한다.
 */
@Component
public class RoomRegistry {

    public record RoomInfo(String roomId, String tenant, String customerId, Set<String> agents, boolean closed) {}

    private final Map<String, RoomInfo> rooms = new ConcurrentHashMap<>();

    public RoomInfo create(String tenant, String customerId) {
        String roomId = "r-" + UUID.randomUUID().toString().substring(0, 8);
        RoomInfo info = new RoomInfo(roomId, tenant, customerId, Set.of(), false);
        rooms.put(roomId, info);
        return info;
    }

    public Optional<RoomInfo> find(String roomId) {
        return Optional.ofNullable(rooms.get(roomId));
    }

    public RoomInfo assign(String roomId, String agentId) {
        return rooms.compute(roomId, (k, r) -> {
            if (r == null) throw new IllegalArgumentException("없는 방: " + roomId);
            var agents = new java.util.HashSet<>(r.agents());
            agents.add(agentId);
            return new RoomInfo(r.roomId(), r.tenant(), r.customerId(), Set.copyOf(agents), r.closed());
        });
    }

    public RoomInfo unassign(String roomId, String agentId) {
        return rooms.compute(roomId, (k, r) -> {
            if (r == null) throw new IllegalArgumentException("없는 방: " + roomId);
            var agents = new java.util.HashSet<>(r.agents());
            agents.remove(agentId);
            return new RoomInfo(r.roomId(), r.tenant(), r.customerId(), Set.copyOf(agents), r.closed());
        });
    }

    public void close(String roomId) {
        rooms.computeIfPresent(roomId, (k, r) -> new RoomInfo(r.roomId(), r.tenant(), r.customerId(), r.agents(), true));
    }
}
