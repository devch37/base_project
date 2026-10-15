package tutor.chat.secure.room;

import org.springframework.stereotype.Component;
import tutor.chat.secure.auth.ChatPrincipal;

/**
 * 기본 규칙 — 기본은 "거부"(default deny), 명시적으로 맞는 경우만 허용.
 * <ol>
 *   <li>방이 존재하고, 사용자와 같은 고객사여야 한다 (다른 회사 방 엿보기 차단)</li>
 *   <li>CUSTOMER: 토큰에 적힌 자기 방에서 READ/WRITE 만</li>
 *   <li>AGENT: 지금 배정된 방에서 READ/WRITE/CLOSE</li>
 *   <li>종료된 방: READ 만</li>
 * </ol>
 */
@Component
public class DefaultRoomAccessPolicy implements RoomAccessPolicy {

    private final RoomRegistry rooms;

    public DefaultRoomAccessPolicy(RoomRegistry rooms) {
        this.rooms = rooms;
    }

    @Override
    public boolean allowed(ChatPrincipal user, String roomId, RoomAction action) {
        var room = rooms.find(roomId).orElse(null);
        if (room == null || !room.tenant().equals(user.tenant())) return false;
        if (room.closed() && action != RoomAction.READ) return false;

        return switch (user.role()) {
            case CUSTOMER -> action != RoomAction.CLOSE
                    && user.rooms().contains(roomId)
                    && room.customerId().equals(user.userId());
            case AGENT -> room.agents().contains(user.userId());
        };
    }
}
