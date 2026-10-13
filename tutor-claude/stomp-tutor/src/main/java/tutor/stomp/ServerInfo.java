package tutor.stomp;

import com.hazelcast.core.HazelcastInstance;
import java.util.Map;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.web.context.WebServerInitializedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * "지금 몇 번 포트 서버에 붙어 있나"를 알려 주는 작은 REST API (GET /api/info).
 * 서버 2대 실습(3단계)에서 화면 상단에 표시한다.
 */
@RestController
public class ServerInfo {

    private volatile int port;
    private final ObjectProvider<HazelcastInstance> hazelcast; // 1대 모드에서는 Bean 이 없을 수 있다

    public ServerInfo(ObjectProvider<HazelcastInstance> hazelcast) {
        this.hazelcast = hazelcast;
    }

    /** 실제로 열린 포트는 서버가 뜬 뒤에야 안다 (테스트처럼 port=0 이면 무작위) */
    @EventListener
    public void onStarted(WebServerInitializedEvent e) {
        this.port = e.getWebServer().getPort();
    }

    public int port() {
        return port;
    }

    @GetMapping("/api/info")
    public Map<String, Object> info() {
        HazelcastInstance hz = hazelcast.getIfAvailable();
        return Map.of(
                "port", port,
                "hazelcast", hz != null,
                "clusterMembers", hz == null ? 1 : hz.getCluster().getMembers().size());
    }
}
