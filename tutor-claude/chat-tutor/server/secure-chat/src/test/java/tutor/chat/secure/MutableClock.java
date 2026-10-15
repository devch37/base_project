package tutor.chat.secure;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

/** 테스트에서 "시간을 앞으로 감는" 시계. 15분을 실제로 기다리지 않고 만료를 검증한다. */
public class MutableClock extends Clock {

    private volatile Instant now = Instant.now();

    public void advance(Duration d) {
        now = now.plus(d);
    }

    @Override
    public ZoneId getZone() {
        return ZoneOffset.UTC;
    }

    @Override
    public Clock withZone(ZoneId zone) {
        return this;
    }

    @Override
    public Instant instant() {
        return now;
    }
}
