package tutor.chat.stomp;

import java.time.Clock;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 방마다 최근 N 개 메시지를 메모리에 보관하고, 순번(seq)을 붙인다.
 * 재연결한 클라이언트가 "놓친 메시지"를 다시 받는 데 쓴다 (09장).
 */
@Component
public class ChatHistory {

    private final int capacity;
    private final Clock clock = Clock.systemUTC();
    private final Map<String, Room> rooms = new ConcurrentHashMap<>();

    public ChatHistory(@Value("${chat.history-size}") int capacity) {
        this.capacity = capacity;
    }

    private final class Room {
        long nextSeq = 1;
        final Deque<ChatMessage> recent = new ArrayDeque<>();
    }

    /**
     * 순번 부여와 저장을 하나의 락 안에서 한다.
     * 두 스레드가 동시에 append 해도 seq 가 중복되거나, seq 순서와 저장 순서가 어긋나지 않게.
     */
    public ChatMessage append(String roomId, String type, String from, String text) {
        Room room = rooms.computeIfAbsent(roomId, k -> new Room());
        synchronized (room) {
            ChatMessage m = new ChatMessage(roomId, room.nextSeq++, type, from, text, clock.instant());
            room.recent.addLast(m);
            if (room.recent.size() > capacity) room.recent.removeFirst();
            return m;
        }
    }

    /** afterSeq 보다 큰 순번만. 0 이면 보관 중인 전부. */
    public List<ChatMessage> since(String roomId, long afterSeq) {
        Room room = rooms.get(roomId);
        if (room == null) return List.of();
        synchronized (room) {
            return room.recent.stream().filter(m -> m.seq() > afterSeq).toList();
        }
    }
}
