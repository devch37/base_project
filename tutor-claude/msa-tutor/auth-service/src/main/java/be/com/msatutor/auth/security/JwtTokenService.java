package be.com.msatutor.auth.security;

import be.com.msatutor.auth.domain.AuthUser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtTokenService {

    private final JwtProperties properties;
    private final SecretKey key;

    public JwtTokenService(JwtProperties properties) {
        this.properties = properties;
        this.key = Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
    }

    public String generate(AuthUser user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(properties.accessTokenMinutes() * 60);

        // Keep token minimal; roles/scopes should be added only if required by services.
        return Jwts.builder()
            .issuer(properties.issuer())
            .subject(user.getEmail())
            .claim("uid", user.getId())
            .claim("role", user.getRole())
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiresAt))
            .signWith(key)
            .compact();
    }
}
