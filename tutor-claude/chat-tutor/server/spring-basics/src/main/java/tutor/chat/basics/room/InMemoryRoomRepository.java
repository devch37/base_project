package tutor.chat.basics.room;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Repository;

/**
 * 서버 "로컬 메모리" 구현.
 *
 * <p>ConcurrentHashMap 을 쓰는 이유: 톰캣은 요청마다 다른 스레드를 쓰므로
 * 여러 스레드가 동시에 이 Map 을 만진다. 일반 HashMap 이면 데이터가 깨질 수 있다.
 *
 * <p>함정(23장 예고): 서버를 2대 띄우면 각자 자기 Map 을 가진다.
 * 1번 서버에서 만든 방을 2번 서버는 모른다. → "공유 상태"가 필요해지는 순간.
 */
@Repository // @Component 의 일종. "이 클래스의 객체를 Spring 이 만들어 관리해 줘(Bean)"
public class InMemoryRoomRepository implements RoomRepository {

    private final Map<String, Room> rooms = new ConcurrentHashMap<>();

    @Override
    public Room save(Room room) {
        rooms.put(room.id(), room);
        return room;
    }

    @Override
    public Optional<Room> findById(String id) {
        return Optional.ofNullable(rooms.get(id));
    }

    @Override
    public List<Room> findAll() {
        return new ArrayList<>(rooms.values());
    }
}
