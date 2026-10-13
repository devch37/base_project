package tutor.stomp.step3_hazelcast;

import com.hazelcast.config.Config;
import com.hazelcast.core.Hazelcast;
import com.hazelcast.core.HazelcastInstance;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.SimpMessagingTemplate;

/**
 * [3단계] app.hazelcast.enabled 값에 따라 Bean 을 골라 등록한다.
 *
 *   enabled=false (기본) → LocalChatBroadcaster      + HistoryStore(ConcurrentHashMap)
 *   enabled=true         → HazelcastChatBroadcaster  + HistoryStore(IMap) + HazelcastInstance
 *
 * ChatController 는 ChatBroadcaster·HistoryStore "인터페이스/타입"만 알기 때문에 한 줄도 안 바뀐다.
 */
@Configuration
public class BroadcastConfig {

    // ── 서버 1대 ───────────────────────────────────────────────
    @Configuration
    @ConditionalOnProperty(name = "app.hazelcast.enabled", havingValue = "false", matchIfMissing = true)
    static class Single {
        @Bean
        ChatBroadcaster chatBroadcaster(SimpMessagingTemplate template) {
            return new LocalChatBroadcaster(template);
        }

        @Bean
        HistoryStore historyStore() {
            return new HistoryStore(new ConcurrentHashMap<>());
        }
    }

    // ── 서버 N대 (Hazelcast) ───────────────────────────────────
    @Configuration
    @ConditionalOnProperty(name = "app.hazelcast.enabled", havingValue = "true")
    static class Cluster {

        /**
         * 우리 Spring 앱 "안에서" Hazelcast 멤버를 띄운다(임베디드).
         * 앱을 2개 띄우면 멤버 2개가 서로를 찾아 하나의 클러스터가 된다.
         */
        @Bean(destroyMethod = "shutdown")
        HazelcastInstance hazelcast(@Value("${app.hazelcast.members}") List<String> members,
                                    @Value("${app.hazelcast.cluster-name:stomp-tutor}") String clusterName,
                                    @Value("${app.hazelcast.port:5701}") int port) {
            Config config = new Config();
            config.setClusterName(clusterName);           // 같은 이름끼리만 합쳐진다
            config.setProperty("hazelcast.logging.type", "slf4j");
            config.setProperty("hazelcast.phone.home.enabled", "false");
            // 멤버끼리 통신하는 포트 (HTTP 포트 8081/8082 와 별개!). 5701 이 사용 중이면 5702, 5703… 으로 자동 증가
            config.getNetworkConfig().setPort(port).setPortAutoIncrement(true);
            var join = config.getNetworkConfig().getJoin();
            join.getMulticastConfig().setEnabled(false);              // 자동 탐색 끄고
            join.getTcpIpConfig().setEnabled(true).setMembers(members); // 주소를 직접 적는다
            return Hazelcast.newHazelcastInstance(config);
        }

        @Bean
        ChatBroadcaster chatBroadcaster(HazelcastInstance hz, SimpMessagingTemplate template) {
            return new HazelcastChatBroadcaster(hz, template);
        }

        @Bean
        HistoryStore historyStore(HazelcastInstance hz) {
            return new HistoryStore(hz.getMap("history")); // IMap 은 ConcurrentMap 이다
        }
    }
}
