package tutor.chat.basics.policy;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

/**
 * 가상의 고객사 "acme-bank" 정책: 평일 09:00~18:00 (서울 시간)만 상담 가능.
 *
 * <p>시간 판단에 Instant(절대 시각)를 받고, 시간대는 정책이 직접 정한다.
 * 서버가 UTC 로 돌아도 "서울 기준 영업시간"이 정확히 계산된다.
 * (LocalDateTime.now() 를 쓰면 서버 시간대에 따라 결과가 바뀌는 버그가 생긴다.)
 */
public class BusinessHoursConsultPolicy implements ConsultPolicy {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    private static final LocalTime OPEN = LocalTime.of(9, 0);
    private static final LocalTime CLOSE = LocalTime.of(18, 0);

    @Override
    public String name() {
        return "acme-bank";
    }

    @Override
    public PolicyDecision allowOpen(String customerId, Instant now) {
        ZonedDateTime seoul = now.atZone(SEOUL);
        DayOfWeek day = seoul.getDayOfWeek();
        if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) {
            return PolicyDecision.deny("주말에는 상담이 운영되지 않습니다.");
        }
        LocalTime time = seoul.toLocalTime();
        if (time.isBefore(OPEN) || !time.isBefore(CLOSE)) {
            return PolicyDecision.deny("상담 가능 시간은 평일 09:00~18:00 입니다.");
        }
        return PolicyDecision.allow();
    }
}
