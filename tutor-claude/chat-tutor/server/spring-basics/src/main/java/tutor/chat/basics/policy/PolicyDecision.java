package tutor.chat.basics.policy;

/**
 * 정책 판단 결과. boolean 하나 대신 "이유"를 같이 돌려준다.
 * 거절 사유를 사용자에게 보여 주거나 로그에 남겨야 하기 때문이다.
 */
public record PolicyDecision(boolean allowed, String reason) {
    public static PolicyDecision allow() {
        return new PolicyDecision(true, "허용");
    }

    public static PolicyDecision deny(String reason) {
        return new PolicyDecision(false, reason);
    }
}
