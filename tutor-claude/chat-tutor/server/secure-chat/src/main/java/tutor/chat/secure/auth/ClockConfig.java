package tutor.chat.secure.auth;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** 시각도 주입받는다 — 테스트에서 "15분 뒤"를 기다리지 않고 시계를 옮기기 위해 (05장과 같은 이유). */
@Configuration
public class ClockConfig {
    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
