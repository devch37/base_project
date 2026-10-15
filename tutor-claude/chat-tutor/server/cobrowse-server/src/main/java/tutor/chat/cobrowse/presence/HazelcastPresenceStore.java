package tutor.chat.cobrowse.presence;

import com.hazelcast.map.IMap;
import com.hazelcast.query.Predicates;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeUnit;

/** 서버 N대용: IMap 의 항목별 TTL 을 그대로 쓴다. */
public class HazelcastPresenceStore implements PresenceStore {

    private final IMap<String, PresenceEntry> map;

    public HazelcastPresenceStore(IMap<String, PresenceEntry> map) {
        this.map = map;
    }

    @Override
    public void put(String key, PresenceEntry entry, Duration ttl) {
        map.put(key, entry, ttl.toMillis(), TimeUnit.MILLISECONDS);
    }

    @Override
    public void remove(String key) {
        map.delete(key); // remove 와 달리 이전 값을 돌려받지 않아 네트워크 비용이 적다
    }

    @Override
    public List<PresenceEntry> inRoom(String roomId) {
        return List.copyOf(map.values(Predicates.equal("roomId", roomId)));
    }
}
