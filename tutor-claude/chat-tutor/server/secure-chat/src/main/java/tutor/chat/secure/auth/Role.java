package tutor.chat.secure.auth;

/** 역할. 권한 판단의 한 축 (나머지 축: 사용자, 방) */
public enum Role {
    CUSTOMER, // 상담을 받는 고객 — 자기 방 하나만
    AGENT     // 상담사 — 배정된 방들
}
