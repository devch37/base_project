package tutor.chat.cobrowse.presence;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** 서버 1대용. TTL 을 "만료 시각"으로 흉내 내서 Hazelcast 버전과 의미를 맞춘다. */
public class LocalPresenceStore implements PresenceStore {

    private record Timed(PresenceEntry entry, Instant expiresAt) {}

    private final Map<String, Timed> entries = new ConcurrentHashMap<>();
    private final Clock clock;

    public LocalPresenceStore(Clock clock) {
        this.clock = clock;
    }

    @Override
    public void put(String key, PresenceEntry entry, Duration ttl) {
        entries.put(key, new Timed(entry, clock.instant().plus(ttl)));
    }

    @Override
    public void remove(String key) {
        entries.remove(key);
    }

    @Override
    public List<PresenceEntry> inRoom(String roomId) {
        Instant now = clock.instant();
        entries.values().removeIf(t -> !now.isBefore(t.expiresAt())); // 읽을 때 만료분 청소
        return entries.values().stream().map(Timed::entry).filter(e -> e.getRoomId().equals(roomId)).toList();
    }
}
