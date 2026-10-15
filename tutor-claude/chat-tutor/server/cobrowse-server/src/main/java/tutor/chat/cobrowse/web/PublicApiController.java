package tutor.chat.cobrowse.web;

import com.hazelcast.core.HazelcastInstance;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tutor.chat.cobrowse.auth.SessionRegistry;

/**
 * 인증 없는 공개 API. "지금 어느 서버에 붙어 있나"를 보여 준다 (23장 로드밸런싱 실습).
 * CorsConfig 에 의해 허용된 Origin 의 브라우저 JS 만 응답을 읽을 수 있다 (22장 CORS 실습).
 */
@RestController
@RequestMapping("/api/public")
public class PublicApiController {

    private final String nodeId;
    private final SessionRegistry sessions;
    private final ObjectProvider<HazelcastInstance> hazelcast; // 클러스터 모드가 아니면 Bean 이 없다 → ObjectProvider

    public PublicApiController(@Value("${chat.node-id}") String nodeId, SessionRegistry sessions,
                               ObjectProvider<HazelcastInstance> hazelcast) {
        this.nodeId = nodeId;
        this.sessions = sessions;
        this.hazelcast = hazelcast;
    }

    @GetMapping("/node")
    public Map<String, Object> node() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("nodeId", nodeId);
        m.put("connections", sessions.size());
        HazelcastInstance hz = hazelcast.getIfAvailable();
        m.put("cluster", hz != null);
        m.put("clusterMembers", hz == null ? 1 : hz.getCluster().getMembers().size());
        return m;
    }
}
