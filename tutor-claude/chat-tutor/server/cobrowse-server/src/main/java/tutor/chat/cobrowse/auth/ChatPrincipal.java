package tutor.chat.cobrowse.auth;

// (secure-chat 모듈의 같은 이름 클래스와 동일. 설명 주석은 그쪽(10~12장)을 참고)

import java.security.Principal;
import java.time.Instant;
import java.util.Set;

/**
 * "검증된" 사용자 정보. JWT 를 검증한 뒤에만 만들어진다.
 *
 * <p>STOMP 세션에 setUser(principal) 로 붙여 두면, 이후 그 연결로 오는 모든 메시지에서
 * 컨트롤러가 Principal 파라미터로 받을 수 있다. 클라이언트가 본문에 적은 "from" 같은 값은 믿지 않는다.
 *
 * <p>getName() 은 /user/queue/.. 의 "사용자"를 찾는 키로도 쓰인다.
 * 같은 userId 로 탭을 두 개 열면 두 연결 모두 /user/queue 메시지를 받는다.
 */
public record ChatPrincipal(
        String userId,
        String tenant,
        Role role,
        Set<String> rooms,   // CUSTOMER: 토큰에 박힌 자기 방. AGENT: 비어 있음(서버에서 배정 조회)
        Instant expiresAt,
        String tokenId       // jti: 토큰 고유 ID (강제 만료/추적용)
) implements Principal {

    @Override
    public String getName() {
        return tenant + ":" + userId; // 고객사가 달라도 userId 가 같을 수 있으므로 tenant 를 붙인다
    }

    public boolean isExpired(Instant now) {
        return !now.isBefore(expiresAt);
    }
}
