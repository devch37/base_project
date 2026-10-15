package tutor.chat.secure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import org.junit.jupiter.api.Test;
import tutor.chat.secure.auth.InvalidTokenException;
import tutor.chat.secure.auth.JwtProperties;
import tutor.chat.secure.auth.JwtService;
import tutor.chat.secure.auth.Role;

/** 11장: JWT 를 직접 만들고, 뜯어보고, 위조해 본다. Spring 없이 순수 단위 테스트. */
class JwtServiceTest {

    MutableClock clock = new MutableClock();
    JwtProperties props = new JwtProperties("chat-tutor", "test-secret-0123456789-0123456789-abcdef",
            Duration.ofMinutes(15), Duration.ofHours(2), Duration.ofSeconds(30));
    JwtService jwt = new JwtService(props, clock);

    @Test
    void 발급한_토큰을_검증하면_클레임이_복원된다() {
        var issued = jwt.issue("c-1", "acme-bank", Role.CUSTOMER, List.of("r-1"), null);
        var p = jwt.verify(issued.token());
        assertThat(p.userId()).isEqualTo("c-1");
        assertThat(p.tenant()).isEqualTo("acme-bank");
        assertThat(p.role()).isEqualTo(Role.CUSTOMER);
        assertThat(p.rooms()).containsExactly("r-1");
    }

    @Test
    void 페이로드는_암호화가_아니라_base64라서_누구나_읽을_수_있다() {
        String token = jwt.issue("c-1", "acme-bank", Role.CUSTOMER, List.of("r-1"), null).token();
        String[] parts = token.split("\\.");
        assertThat(parts).hasSize(3); // 헤더.페이로드.서명

        String payload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
        assertThat(payload).contains("\"sub\":\"c-1\"").contains("\"role\":\"CUSTOMER\"");
    }

    @Test
    void 페이로드를_고치면_서명이_맞지_않아_거부된다() {
        String token = jwt.issue("c-1", "acme-bank", Role.CUSTOMER, List.of("r-1"), null).token();
        String[] parts = token.split("\\.");
        String payload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
        // 공격자: "나는 CUSTOMER 가 아니라 AGENT 다"
        String forged = payload.replace("CUSTOMER", "AGENT");
        String tampered = parts[0] + "." + Base64.getUrlEncoder().withoutPadding()
                .encodeToString(forged.getBytes(StandardCharsets.UTF_8)) + "." + parts[2];

        assertThatThrownBy(() -> jwt.verify(tampered)).isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void alg_none_서명없는_토큰은_거부된다() {
        String header = Base64.getUrlEncoder().withoutPadding().encodeToString("{\"alg\":\"none\"}".getBytes());
        String body = Base64.getUrlEncoder().withoutPadding().encodeToString(
                "{\"sub\":\"x\",\"iss\":\"chat-tutor\",\"aud\":\"chat-ws\",\"role\":\"AGENT\",\"tenant\":\"acme-bank\"}".getBytes());
        assertThatThrownBy(() -> jwt.verify(header + "." + body + ".")).isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void 만료_시각이_지나면_거부되지만_시계오차_30초는_허용한다() {
        String token = jwt.issue("c-1", "acme-bank", Role.CUSTOMER, List.of("r-1"), Duration.ofMinutes(1)).token();

        clock.advance(Duration.ofSeconds(80)); // 만료 20초 지남 → 허용 오차(30초) 안
        assertThat(jwt.verify(token).userId()).isEqualTo("c-1");

        clock.advance(Duration.ofSeconds(20)); // 만료 40초 지남 → 거부
        assertThatThrownBy(() -> jwt.verify(token)).hasMessageContaining("만료");
    }

    @Test
    void 다른_비밀키로_만든_토큰은_거부된다() {
        JwtService other = new JwtService(new JwtProperties("chat-tutor", "another-secret-0123456789-0123456789-xyz",
                Duration.ofMinutes(15), Duration.ofHours(2), Duration.ofSeconds(30)), clock);
        String foreign = other.issue("c-1", "acme-bank", Role.AGENT, List.of(), null).token();
        assertThatThrownBy(() -> jwt.verify(foreign)).isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void 너무_긴_TTL은_maxTtl로_잘린다() {
        var issued = jwt.issue("a", "acme-bank", Role.AGENT, List.of(), Duration.ofDays(30));
        assertThat(Duration.between(clock.instant(), issued.expiresAt())).isEqualTo(Duration.ofHours(2));
    }

    @Test
    void 짧은_비밀키로는_기동조차_안된다() {
        assertThatThrownBy(() -> new JwtService(new JwtProperties("i", "short", Duration.ofMinutes(1),
                Duration.ofHours(1), Duration.ZERO), clock)).isInstanceOf(IllegalStateException.class);
    }
}
