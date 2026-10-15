package tutor.chat.secure.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.Date;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Component;

/**
 * JWT 발급과 검증 (11장).
 *
 * <p>JWT = base64url(헤더) . base64url(페이로드) . base64url(서명)
 * <pre>
 * 헤더     {"alg":"HS256"}
 * 페이로드 {"jti":"..","iss":"chat-tutor","sub":"c-100","aud":["chat-ws"],
 *          "iat":1760000000,"exp":1760000900,"tenant":"acme-bank","role":"CUSTOMER","rooms":["r-1"]}
 * 서명     HMAC-SHA256(헤더.페이로드, 비밀키)
 * </pre>
 *
 * <p><b>서명 ≠ 암호화.</b> 페이로드는 base64 일 뿐이라 누구나 읽을 수 있다(jwt.io 에 붙여 보라).
 * 서명이 보장하는 것은 "비밀키를 가진 쪽이 만들었고, 한 글자도 바뀌지 않았다"는 것뿐.
 * → 주민번호·전화번호 같은 개인정보는 클레임에 넣지 않는다.
 *
 * <p>HS256(대칭키) vs RS256(비대칭키): 발급자와 검증자가 같은 서버면 HS256 으로 충분하다.
 * 검증하는 서비스가 여럿이고 그들이 "발급 능력"까지 가지면 안 될 때 RS256(공개키로 검증만 가능)을 쓴다.
 */
@Component
public class JwtService {

    static final String AUDIENCE = "chat-ws";

    private final JwtProperties props;
    private final SecretKey key;
    private final Clock clock;

    public JwtService(JwtProperties props, Clock clock) {
        byte[] secret = props.secret().getBytes(StandardCharsets.UTF_8);
        if (secret.length < 32) {
            // 짧은 비밀키는 무차별 대입으로 깨질 수 있다. 기동 자체를 막는 편이 안전하다 (fail fast).
            throw new IllegalStateException("chat.jwt.secret 은 최소 32바이트여야 합니다");
        }
        this.props = props;
        this.key = Keys.hmacShaKeyFor(secret);
        this.clock = clock;
    }

    public record Issued(String token, Instant expiresAt, String tokenId) {}

    public Issued issue(String userId, String tenant, Role role, Collection<String> rooms, Duration ttl) {
        Duration effective = ttl == null ? props.defaultTtl() : ttl;
        if (effective.compareTo(props.maxTtl()) > 0) effective = props.maxTtl(); // 너무 긴 토큰은 탈취 시 피해가 크다
        Instant now = clock.instant();
        Instant exp = now.plus(effective);
        String jti = UUID.randomUUID().toString();

        String token = Jwts.builder()
                .id(jti)
                .issuer(props.issuer())
                .subject(userId)
                .audience().add(AUDIENCE).and()  // "이 토큰은 채팅 WebSocket 용" — 다른 서비스 토큰의 재사용 방지
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .claim("tenant", tenant)
                .claim("role", role.name())
                .claim("rooms", List.copyOf(rooms))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
        return new Issued(token, exp, jti);
    }

    /**
     * 검증 순서: 서명 → 만료(exp) → 발급자(iss) → 대상(aud) → 필수 클레임.
     * 하나라도 실패하면 InvalidTokenException. 실패 이유는 로그용이고 클라이언트에게는 뭉뚱그려 알린다
     * ("서명이 틀렸다"고 친절히 알려 주면 공격자에게 힌트가 된다).
     */
    public ChatPrincipal verify(String token) {
        if (token == null || token.isBlank()) throw new InvalidTokenException("토큰 없음");
        try {
            Claims c = Jwts.parser()
                    .verifyWith(key)                // alg:none(서명 없는 토큰)은 여기서 거부된다
                    .requireIssuer(props.issuer())
                    .requireAudience(AUDIENCE)
                    .clockSkewSeconds(props.clockSkew().toSeconds()) // 서버 간 시계 오차 허용
                    .clock(() -> Date.from(clock.instant()))
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            Role role = Role.valueOf(c.get("role", String.class));
            String tenant = c.get("tenant", String.class);
            if (tenant == null || c.getSubject() == null) throw new InvalidTokenException("필수 클레임 누락");
            Set<String> rooms = new LinkedHashSet<>();
            Object raw = c.get("rooms");
            if (raw instanceof Collection<?> list) list.forEach(r -> rooms.add(String.valueOf(r)));

            return new ChatPrincipal(c.getSubject(), tenant, role, Set.copyOf(rooms),
                    c.getExpiration().toInstant(), c.getId());
        } catch (ExpiredJwtException e) {
            throw new InvalidTokenException("토큰 만료");
        } catch (JwtException | IllegalArgumentException | NullPointerException e) {
            throw new InvalidTokenException("유효하지 않은 토큰");
        }
    }
}
