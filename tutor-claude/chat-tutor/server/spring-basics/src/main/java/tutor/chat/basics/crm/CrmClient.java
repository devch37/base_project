package tutor.chat.basics.crm;

import java.net.http.HttpClient;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

/**
 * 06장: 우리 서버 → 고객사 CRM 서버로 HTTP 호출.
 *
 * <p>서버 간 호출에서 반드시 정해야 하는 네 가지:
 * <ol>
 *   <li><b>타임아웃</b> — 안 정하면 상대가 멈췄을 때 우리 스레드도 영원히 멈춘다.
 *       톰캣 스레드(기본 200개)가 다 묶이면 우리 서버 전체가 응답 불능이 된다.</li>
 *   <li><b>오류 분류</b> — 4xx(내 요청이 틀림: 재시도 무의미) vs 5xx·타임아웃(상대 사정: 재시도 의미 있음)</li>
 *   <li><b>재시도</b> — GET 처럼 여러 번 해도 결과가 같은(멱등) 요청만. POST 재시도는 중복 생성 위험.</li>
 *   <li><b>대체값(fallback)</b> — CRM 이 죽었다고 상담까지 막을 것인가? 여기서는 "고객"이라는 이름으로 진행.</li>
 * </ol>
 */
@Component
public class CrmClient {

    private static final Logger log = LoggerFactory.getLogger(CrmClient.class);
    static final String FALLBACK_NAME = "고객";

    private final RestClient restClient;
    private final int maxAttempts;

    public CrmClient(RestClient.Builder builder, CrmProperties props) {
        // 연결 타임아웃: TCP 연결 맺기까지 기다리는 시간 (상대 서버가 꺼져 있거나 방화벽)
        HttpClient httpClient = HttpClient.newBuilder().connectTimeout(props.connectTimeout()).build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        // 읽기 타임아웃: 연결은 됐는데 응답이 안 올 때 (상대 서버가 느리거나 멈춤)
        factory.setReadTimeout(props.readTimeout());

        this.restClient = builder.baseUrl(props.baseUrl()).requestFactory(factory).build();
        this.maxAttempts = Math.max(1, props.maxAttempts());
    }

    /** RoomService 가 쓰는 단순한 버전 */
    public String findCustomerName(String customerId) {
        return lookup(customerId).name();
    }

    public CrmResult lookup(String customerId) {
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                Map<?, ?> body = restClient.get()
                        .uri("/customers/{id}", customerId) // {id} 는 URL 인코딩까지 해 준다 (직접 문자열 더하기 금지)
                        .retrieve()                          // 4xx/5xx 면 예외를 던진다
                        .body(Map.class);
                Object name = body == null ? null : body.get("name");
                return new CrmResult(name == null ? FALLBACK_NAME : name.toString(), CrmResult.Outcome.FOUND, attempt);

            } catch (HttpClientErrorException.NotFound e) {
                // 404: 몇 번을 다시 물어도 없다. 즉시 포기.
                return new CrmResult("미등록 고객", CrmResult.Outcome.NOT_FOUND, attempt);

            } catch (HttpClientErrorException e) {
                // 그 외 4xx(400, 401...): 우리 요청이나 설정(API 키 등)이 틀렸다는 뜻. 재시도 무의미 → 바로 대체값.
                log.warn("CRM 4xx 응답 status={} customerId={}", e.getStatusCode(), customerId);
                return new CrmResult(FALLBACK_NAME, CrmResult.Outcome.UNAVAILABLE, attempt);

            } catch (HttpServerErrorException | ResourceAccessException e) {
                // 5xx 또는 ResourceAccessException(타임아웃·연결 거부 등 I/O 오류): 일시적일 수 있다 → 재시도
                log.warn("CRM 호출 실패 attempt={}/{} cause={}", attempt, maxAttempts, e.getMessage());
                sleepBeforeRetry(attempt);
            }
        }
        return new CrmResult(FALLBACK_NAME, CrmResult.Outcome.UNAVAILABLE, maxAttempts);
    }

    private void sleepBeforeRetry(int attempt) {
        if (attempt >= maxAttempts) return;
        try {
            Thread.sleep(100L * attempt); // 짧은 선형 백오프. 실시간 재연결의 지수 백오프+jitter 는 09장에서.
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt(); // 인터럽트 신호를 삼키지 않는다
        }
    }
}
