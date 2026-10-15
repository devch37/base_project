package tutor.chat.secure.room;

import tutor.chat.secure.auth.ChatPrincipal;

/**
 * "사용자 × 방 × 역할 × 행동" 접근 제어의 계약.
 * 05장처럼 인터페이스로 둔 이유: 고객사마다 규칙이 다르다
 * (예: "슈퍼바이저는 모든 방을 읽기만 가능", "종료된 방도 고객은 읽을 수 있음").
 */
public interface RoomAccessPolicy {
    boolean allowed(ChatPrincipal user, String roomId, RoomAction action);
}
