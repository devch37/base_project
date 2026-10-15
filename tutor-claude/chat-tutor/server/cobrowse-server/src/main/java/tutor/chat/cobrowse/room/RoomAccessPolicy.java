package tutor.chat.cobrowse.room;

import tutor.chat.cobrowse.auth.ChatPrincipal;

/** 고객사별로 바꿔 끼울 수 있는 접근 제어 규칙 (05장의 정책 교체 패턴) */
public interface RoomAccessPolicy {
    boolean allowed(ChatPrincipal user, String roomId, RoomAction action);
}
