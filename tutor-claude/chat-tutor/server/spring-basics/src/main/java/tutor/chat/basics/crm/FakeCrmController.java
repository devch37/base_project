package tutor.chat.basics.crm;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 실습용 "가짜 고객사 CRM". 실제로는 다른 회사의 다른 서버라고 상상하자.
 * 고객 ID 접두어로 장애 상황을 흉내 낸다:
 * <ul>
 *   <li>slow-*  : 3초 뒤 응답 → 우리 읽기 타임아웃(2s)에 걸린다</li>
 *   <li>err-*   : 500 → 재시도 후 대체값</li>
 *   <li>none-*  : 404 → 재시도 없이 "미등록 고객"</li>
 *   <li>flaky-* : 첫 호출만 503, 두 번째는 성공 → 재시도의 효과</li>
 * </ul>
 */
@RestController
@RequestMapping("/fake-crm")
public class FakeCrmController {

    private final Set<String> flakySeen = ConcurrentHashMap.newKeySet();

    @GetMapping("/customers/{id}")
    public ResponseEntity<Map<String, String>> customer(@PathVariable String id) throws InterruptedException {
        if (id.startsWith("slow-")) {
            Thread.sleep(3000);
        } else if (id.startsWith("err-")) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } else if (id.startsWith("none-")) {
            return ResponseEntity.notFound().build();
        } else if (id.startsWith("flaky-") && flakySeen.add(id)) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }
        return ResponseEntity.ok(Map.of("id", id, "name", "홍길동(" + id + ")"));
    }
}
