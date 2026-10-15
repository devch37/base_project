package tutor.chat.secure.auth;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "chat.jwt")
public record JwtProperties(String issuer, String secret, Duration defaultTtl, Duration maxTtl, Duration clockSkew) {}
