package tutor.chat.basics.room;

import java.util.List;
import java.util.Optional;

/**
 * 저장소 "인터페이스".
 *
 * <p>RoomService 는 이 인터페이스만 안다. 실제 구현이 메모리(Map)인지,
 * DB 인지, 23장의 Hazelcast IMap 인지는 몰라도 된다.
 * → 구현을 바꿔도 Service 코드는 그대로. 이것이 "인터페이스에 의존하라"의 실제 이득이다.
 */
public interface RoomRepository {
    Room save(Room room);
    Optional<Room> findById(String id);
    List<Room> findAll();
}
