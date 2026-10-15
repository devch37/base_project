package tutor.chat.cobrowse.auth;

// (secure-chat 모듈의 같은 이름 클래스와 동일. 설명 주석은 그쪽(10~12장)을 참고)

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;
import java.util.Optional;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 고객사별 내부 API 키 (chat.tenants.{tenantId}: {apiKey}).
 *
 * <p><b>Bearer 토큰(JWT) vs 내부 API 키</b>
 * <table>
 *   <tr><th></th><th>내부 API 키</th><th>Bearer JWT</th></tr>
 *   <tr><td>누구의 신원?</td><td>고객사 "서버"</td><td>최종 "사용자"(고객·상담사)</td></tr>
 *   <tr><td>어디에 보관?</td><td>고객사 서버의 환경 변수/비밀 저장소</td><td>사용자 브라우저 메모리</td></tr>
 *   <tr><td>수명</td><td>길다(수개월, 교체 주기 운영)</td><td>짧다(분 단위)</td></tr>
 *   <tr><td>할 수 있는 일</td><td>방 생성·토큰 발급 등 "관리"</td><td>정해진 방에서 채팅</td></tr>
 *   <tr><td>유출 시</td><td>그 고객사의 모든 사용자를 사칭 가능 → 치명적</td><td>그 사용자·그 방·만료까지만</td></tr>
 * </table>
 * 그래서 API 키는 절대 브라우저(JS 번들, HTML)에 넣지 않는다.
 */
@ConfigurationProperties(prefix = "chat")
public record TenantProperties(Map<String, String> tenants) {

    /** 키로 고객사 찾기. 상수 시간 비교(MessageDigest.isEqual)로 타이밍 공격을 피한다. */
    public Optional<String> tenantOf(String apiKey) {
        if (apiKey == null || tenants == null) return Optional.empty();
        byte[] given = apiKey.getBytes(StandardCharsets.UTF_8);
        return tenants.entrySet().stream()
                .filter(e -> MessageDigest.isEqual(e.getValue().getBytes(StandardCharsets.UTF_8), given))
                .map(Map.Entry::getKey)
                .findFirst();
    }
}
