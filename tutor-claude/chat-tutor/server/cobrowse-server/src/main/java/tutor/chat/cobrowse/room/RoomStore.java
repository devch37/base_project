package tutor.chat.cobrowse.room;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentMap;
import java.util.function.UnaryOperator;

/**
 * 방 저장소. 생성자로 받는 ConcurrentMap 이
 * <ul>
 *   <li>단일 서버: ConcurrentHashMap (서버 로컬 메모리)</li>
 *   <li>클러스터: Hazelcast IMap (모든 서버가 보는 공유 상태)</li>
 * </ul>
 * 이다. IMap 은 ConcurrentMap 인터페이스를 구현하므로 이 클래스의 코드는 한 줄도 바뀌지 않는다.
 * → 05장에서 말한 "인터페이스에 의존하면 구현을 바꿔 끼울 수 있다"의 실전 사례.
 *
 * <p>수정은 항상 compute(): "읽고-고치고-쓰기"를 원자적으로.
 * get → 수정 → put 으로 나눠 쓰면 두 서버가 동시에 배정할 때 한쪽 변경이 사라진다(lost update).
 * (IMap 의 compute 는 replace(key, old, new) 비교-교체를 성공할 때까지 반복하는 방식으로 원자성을 보장한다.)
 */
public class RoomStore {

    private final ConcurrentMap<String, RoomInfo> rooms;

    public RoomStore(ConcurrentMap<String, RoomInfo> rooms) {
        this.rooms = rooms;
    }

    public RoomInfo create(String tenant, String customerId, java.time.Instant now) {
        String roomId = "r-" + UUID.randomUUID().toString().substring(0, 8);
        RoomInfo info = new RoomInfo(roomId, tenant, customerId, Set.of(), false, false, now);
        rooms.put(roomId, info);
        return info;
    }

    public Optional<RoomInfo> find(String roomId) {
        return Optional.ofNullable(rooms.get(roomId));
    }

    public List<RoomInfo> listByTenant(String tenant) {
        return rooms.values().stream().filter(r -> r.tenant().equals(tenant)).toList();
    }

    public RoomInfo assign(String roomId, String agentId) {
        return update(roomId, r -> {
            Set<String> next = new HashSet<>(r.agents());
            next.add(agentId);
            return r.withAgents(next);
        });
    }

    public RoomInfo unassign(String roomId, String agentId) {
        return update(roomId, r -> {
            Set<String> next = new HashSet<>(r.agents());
            next.remove(agentId);
            return r.withAgents(next);
        });
    }

    public RoomInfo setRemoteControl(String roomId, boolean on) {
        return update(roomId, r -> r.withRemoteControl(on));
    }

    public RoomInfo close(String roomId) {
        return update(roomId, RoomInfo::asClosed);
    }

    private RoomInfo update(String roomId, UnaryOperator<RoomInfo> change) {
        RoomInfo result = rooms.computeIfPresent(roomId, (k, r) -> change.apply(r));
        if (result == null) throw new IllegalArgumentException("없는 방: " + roomId);
        return result;
    }
}
