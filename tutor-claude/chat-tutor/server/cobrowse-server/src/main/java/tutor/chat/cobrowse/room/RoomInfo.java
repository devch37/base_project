package tutor.chat.cobrowse.room;

import java.io.Serializable;
import java.time.Instant;
import java.util.Set;

/**
 * 상담방 상태. 클러스터 모드에서는 Hazelcast IMap 에 들어가 "다른 서버로 전송"되므로 Serializable.
 * 불변(record)으로 두고, 바꿀 때는 새 객체로 교체한다 — 공유 상태를 부분 수정하다 생기는 경합을 피하기 위해.
 *
 * @param remoteControl 고객이 "상담사의 원격 조작"에 동의했는가 (17장). 기본 false.
 */
public record RoomInfo(
        String roomId,
        String tenant,
        String customerId,
        Set<String> agents,
        boolean remoteControl,
        boolean closed,
        Instant createdAt
) implements Serializable {

    public RoomInfo withAgents(Set<String> next) {
        return new RoomInfo(roomId, tenant, customerId, Set.copyOf(next), remoteControl, closed, createdAt);
    }

    public RoomInfo withRemoteControl(boolean on) {
        return new RoomInfo(roomId, tenant, customerId, agents, on, closed, createdAt);
    }

    public RoomInfo asClosed() {
        return new RoomInfo(roomId, tenant, customerId, agents, false, true, createdAt);
    }
}
