package tutor.chat.cobrowse.auth;

// (secure-chat 모듈의 같은 이름 클래스와 동일. 설명 주석은 그쪽(10~12장)을 참고)

/** 역할. 권한 판단의 한 축 (나머지 축: 사용자, 방) */
public enum Role {
    CUSTOMER, // 상담을 받는 고객 — 자기 방 하나만
    AGENT     // 상담사 — 배정된 방들
}
