package tutor.chat.basics.crm;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * application.yml 의 chat.crm.* 값을 타입이 있는 객체로 받는다.
 * "1s", "500ms" 같은 문자열을 Duration 으로 자동 변환해 준다.
 * @Value("${...}") 를 여기저기 흩뿌리는 것보다 설정이 한눈에 보이고, 오타는 기동 시점에 드러난다.
 */
@ConfigurationProperties(prefix = "chat.crm")
public record CrmProperties(String baseUrl, Duration connectTimeout, Duration readTimeout, int maxAttempts) {}
