package tutor.chat.cobrowse.presence;

import java.time.Duration;
import java.util.List;

/**
 * presence 저장소. 모든 항목은 TTL(수명)을 가진다.
 *
 * <p><b>heartbeat 와 TTL 의 차이</b> (23장)
 * <ul>
 *   <li>heartbeat: "연결" 하나가 살아 있는지 양 끝이 주고받으며 확인. 끊기면 그 연결을 가진 서버가 정리한다.</li>
 *   <li>TTL: "저장된 데이터"의 유통기한. 정리해 줄 서버 자체가 죽었을 때를 대비한 안전장치.</li>
 * </ul>
 * 서버 A 가 전원이 나가면 A 의 연결들은 heartbeat 로 정리될 기회조차 없다 (정리 코드가 A 에서 돌기 때문).
 * 공유 저장소에 남은 A 의 presence 는 A 가 더는 갱신하지 않으므로 TTL 이 지나면 저절로 사라진다.
 */
public interface PresenceStore {
    void put(String key, PresenceEntry entry, Duration ttl);
    void remove(String key);
    List<PresenceEntry> inRoom(String roomId);
}
