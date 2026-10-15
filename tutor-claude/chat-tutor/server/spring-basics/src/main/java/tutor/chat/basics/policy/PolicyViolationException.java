package tutor.chat.basics.policy;

/** 정책 위반. GlobalExceptionHandler 가 403 이 아니라 422 로 바꾼다 — 이유는 그 클래스 주석 참고. */
public class PolicyViolationException extends RuntimeException {
    public PolicyViolationException(String reason) {
        super(reason);
    }
}
