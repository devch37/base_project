package tutor.chat.cobrowse.room;

import java.util.EnumSet;
import java.util.Set;
import tutor.chat.cobrowse.auth.ChatPrincipal;

/**
 * 기본 접근 제어 — default deny.
 *
 * <pre>
 *  행동              CUSTOMER(자기 방)   AGENT(배정된 방)
 *  CHAT_READ/WRITE        O                 O
 *  STATUS_READ            O                 O
 *  SCREEN_SEND            O                 X   ← 상담사가 가짜 화면을 밀어 넣지 못하게
 *  SCREEN_VIEW            X                 O   ← 고객끼리 서로 화면 엿보기 차단
 *  COMMAND_SEND           X                 O (고객 동의 여부는 컨트롤러가 따로 검사 — 아래 설명)
 *  COMMAND_RECEIVE        O                 X
 *  RESYNC_REQUEST         X                 O
 *  CONSENT                O                 X
 *  CLOSE                  X                 O
 *  종료된 방: CHAT_READ, STATUS_READ 만
 * </pre>
 *
 * <p>왜 "고객 동의"는 여기(인터셉터가 부르는 정책)에서 검사하지 않나?
 * 인터셉터에서 거부하면 ERROR 프레임 → 연결 전체가 끊긴다(12장).
 * 동의 철회 직후 상담사가 한 번 클릭했다고 연결이 끊기면 안 된다.
 * → "보안 위반"(남의 방, 역할 위반)은 인터셉터에서 끊고, "업무 규칙 거절"(동의 없음)은 컨트롤러가
 *   /user/queue/errors 로 알려 주고 연결은 유지한다.
 */
public class DefaultRoomAccessPolicy implements RoomAccessPolicy {

    private static final Set<RoomAction> CUSTOMER_ACTIONS = EnumSet.of(
            RoomAction.CHAT_READ, RoomAction.CHAT_WRITE, RoomAction.STATUS_READ,
            RoomAction.SCREEN_SEND, RoomAction.COMMAND_RECEIVE, RoomAction.CONSENT);

    private static final Set<RoomAction> AGENT_ACTIONS = EnumSet.of(
            RoomAction.CHAT_READ, RoomAction.CHAT_WRITE, RoomAction.STATUS_READ,
            RoomAction.SCREEN_VIEW, RoomAction.COMMAND_SEND, RoomAction.RESYNC_REQUEST, RoomAction.CLOSE);

    private static final Set<RoomAction> CLOSED_ROOM_ACTIONS = EnumSet.of(RoomAction.CHAT_READ, RoomAction.STATUS_READ);

    private final RoomStore rooms;

    public DefaultRoomAccessPolicy(RoomStore rooms) {
        this.rooms = rooms;
    }

    @Override
    public boolean allowed(ChatPrincipal user, String roomId, RoomAction action) {
        RoomInfo room = rooms.find(roomId).orElse(null);
        if (room == null || !room.tenant().equals(user.tenant())) return false;
        if (room.closed() && !CLOSED_ROOM_ACTIONS.contains(action)) return false;

        return switch (user.role()) {
            case CUSTOMER -> CUSTOMER_ACTIONS.contains(action)
                    && user.rooms().contains(roomId)
                    && room.customerId().equals(user.userId());
            case AGENT -> AGENT_ACTIONS.contains(action)
                    && room.agents().contains(user.userId());
        };
    }
}
