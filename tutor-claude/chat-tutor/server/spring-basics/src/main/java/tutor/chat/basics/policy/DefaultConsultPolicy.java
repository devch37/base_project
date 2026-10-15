package tutor.chat.basics.policy;

import java.time.Instant;

/** 기본 정책: 언제든 상담 가능. @Component 를 붙이지 않았다 → 등록은 PolicyConfig 가 결정한다. */
public class DefaultConsultPolicy implements ConsultPolicy {

    @Override
    public String name() {
        return "default";
    }

    @Override
    public PolicyDecision allowOpen(String customerId, Instant now) {
        return PolicyDecision.allow();
    }
}
