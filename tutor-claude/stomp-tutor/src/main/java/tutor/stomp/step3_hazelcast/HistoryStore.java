package tutor.stomp.step3_hazelcast;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentMap;
import tutor.stomp.step2_stomp.ChatMessage;

/**
 * 방별 최근 대화 20개 보관.
 *
 * 생성자로 받는 map 이
 *  - 서버 1대: ConcurrentHashMap     (이 서버 메모리)
 *  - 서버 N대: Hazelcast IMap         (모든 서버가 같이 보는 공유 저장소)
 * 이다. IMap 은 ConcurrentMap 을 구현하므로 이 클래스 코드는 똑같다.
 *
 * Topic vs IMap:
 *  - Topic : "지금 듣고 있는 서버"에게 흘려보내는 메시지. 저장되지 않는다. (실시간 방송용)
 *  - IMap  : 저장되는 데이터. 나중에 들어온 사람도 조회할 수 있다. (최근 대화, 방 정보용)
 */
public class HistoryStore {

    private static final int KEEP = 20;
    private final ConcurrentMap<String, List<ChatMessage>> map;

    public HistoryStore(ConcurrentMap<String, List<ChatMessage>> map) {
        this.map = map;
    }

    public void add(ChatMessage m) {
        // compute: "읽고-고치고-쓰기"를 한 번에(원자적으로). 두 서버가 동시에 추가해도 하나가 사라지지 않는다.
        // 리스트를 직접 고치지 않고 새 리스트를 만든다 — IMap 은 값을 복사본으로 주기 때문에 직접 고쳐도 저장되지 않는다.
        map.compute(m.roomId(), (room, old) -> {
            List<ChatMessage> next = new ArrayList<>(old == null ? List.of() : old);
            next.add(m);
            if (next.size() > KEEP) next.remove(0);
            return next;
        });
    }

    public List<ChatMessage> recent(String roomId) {
        return map.getOrDefault(roomId, List.of());
    }
}
