package tutor.chat.secure.room;

/** 방에서 하려는 일. 같은 방이라도 행동마다 필요한 권한이 다르다. */
public enum RoomAction {
    READ,   // 구독 (메시지 받기)
    WRITE,  // 채팅 보내기
    CLOSE   // 상담 종료 — 상담사만
}
