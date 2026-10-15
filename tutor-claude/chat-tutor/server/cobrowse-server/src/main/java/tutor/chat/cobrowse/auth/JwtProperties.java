package tutor.chat.cobrowse.auth;

// (secure-chat 모듈의 같은 이름 클래스와 동일. 설명 주석은 그쪽(10~12장)을 참고)

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "chat.jwt")
public record JwtProperties(String issuer, String secret, Duration defaultTtl, Duration maxTtl, Duration clockSkew) {}
