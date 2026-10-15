package tutor.chat.basics.policy;

import java.time.Instant;

/**
 * 고객사(tenant)마다 달라지는 "상담 정책"의 계약.
 *
 * <p>왜 인터페이스인가?
 * 솔루션(제품)을 여러 고객사에 납품하면 "A 은행은 평일 9~18시만 상담",
 * "B 쇼핑몰은 24시간" 같은 요구가 생긴다. 이걸 if (tenant == "A") ... 로 쓰기 시작하면
 * 고객사가 늘 때마다 핵심 코드를 고쳐야 하고, A 고객사 수정이 B 를 깨뜨린다.
 *
 * <p>대신: 핵심 코드(RoomService)는 이 인터페이스만 보고,
 * 고객사별 차이는 "구현 클래스 + 어떤 Bean 을 등록할지"로 표현한다. (PolicyConfig 참고)
 */
public interface ConsultPolicy {

    /** 정책 이름 (로그·디버깅용) */
    String name();

    /** 이 고객이 지금 상담을 열 수 있는가? */
    PolicyDecision allowOpen(String customerId, Instant now);
}
