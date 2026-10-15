package tutor.chat.basics.crm;

/**
 * 외부 호출 결과를 "이름 + 어떻게 얻었는지"로 돌려준다.
 * 대체값(fallback)을 썼는지 숨기지 않아야 모니터링·테스트에서 장애를 알아챌 수 있다.
 */
public record CrmResult(String name, Outcome outcome, int attempts) {
    public enum Outcome {
        FOUND,        // 정상 응답
        NOT_FOUND,    // 404 — 재시도해도 소용없다
        UNAVAILABLE   // 5xx·타임아웃·연결 실패 — 재시도 후에도 실패해서 대체값 사용
    }
}
