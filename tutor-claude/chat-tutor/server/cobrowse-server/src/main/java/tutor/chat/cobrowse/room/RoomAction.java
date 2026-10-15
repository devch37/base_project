package tutor.chat.cobrowse.room;

/**
 * 같은 방이라도 "무엇을 하려는가"에 따라 허용 여부가 다르다.
 * 역할(CUSTOMER/AGENT)과 짝지어 보면 접근 제어 표가 된다 (12장·17장 README 의 표 참고).
 */
public enum RoomAction {
    CHAT_READ,        // 채팅 구독
    CHAT_WRITE,       // 채팅 보내기
    STATUS_READ,      // 방 상태(입장/동의/종료) 구독
    SCREEN_SEND,      // 화면 프레임 보내기        — 고객만
    SCREEN_VIEW,      // 화면 프레임 구독          — 상담사만
    COMMAND_SEND,     // 원격 클릭·입력 보내기      — 상담사 (고객 동의는 컨트롤러가 확인)
    COMMAND_RECEIVE,  // 원격 명령 구독            — 고객만
    RESYNC_REQUEST,   // 전체 화면 다시 보내 달라   — 상담사 (동의 불필요: 보기만 하는 행동)
    CONSENT,          // 원격 조작 동의/철회        — 고객만
    CLOSE             // 상담 종료                 — 상담사만
}
