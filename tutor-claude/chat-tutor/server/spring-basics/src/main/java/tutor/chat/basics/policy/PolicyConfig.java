package tutor.chat.basics.policy;

import java.time.Clock;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * @Configuration + @Bean: "이 메서드가 돌려주는 객체를 Bean 으로 등록해 줘".
 *
 * <p>@Component 를 클래스에 붙이는 방식과의 차이:
 * <ul>
 *   <li>@Component: 클래스 자신이 "나를 등록해 줘"라고 선언 (등록 여부를 클래스가 결정)</li>
 *   <li>@Bean: 설정 클래스가 "조건에 따라 이걸 등록하자"고 결정 (등록 여부를 바깥이 결정)</li>
 * </ul>
 * 고객사별로 "어떤 구현을 쓸지" 골라야 하므로 여기서는 @Bean + 조건(@ConditionalOnProperty)이 맞다.
 *
 * <p>application.yml 의 chat.tenant 값 하나로 정책이 바뀐다 — 코드 재컴파일 없이.
 *
 * <p>실무 확장: 고객사 전용 코드를 별도 jar 로 빼고, 그 jar 의 자동 설정에서
 * {@code @ConditionalOnMissingBean(ConsultPolicy.class)} 로 "고객사 Bean 이 없을 때만 기본값"을 등록하는
 * 방식도 많이 쓴다. (@ConditionalOnMissingBean 은 자동 설정(AutoConfiguration)에서 쓸 때만
 * 등록 순서가 보장된다는 점에 주의 — 일반 @Configuration 끼리는 순서가 보장되지 않는다.)
 */
@Configuration
public class PolicyConfig {

    @Bean
    @ConditionalOnProperty(name = "chat.tenant", havingValue = "default", matchIfMissing = true)
    public ConsultPolicy defaultConsultPolicy() {
        return new DefaultConsultPolicy();
    }

    @Bean
    @ConditionalOnProperty(name = "chat.tenant", havingValue = "acme-bank")
    public ConsultPolicy acmeBankConsultPolicy() {
        return new BusinessHoursConsultPolicy();
    }

    /**
     * "현재 시각"도 Bean 으로 주입받는다.
     * 코드 곳곳에서 Instant.now() 를 부르면 "토요일 오후 7시" 같은 상황을 테스트할 방법이 없다.
     * 테스트에서는 Clock.fixed(...) 로 바꿔 넣는다. (BusinessHoursPolicyTest 참고)
     */
    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
