package tutor.chat.cobrowse.config;

import com.hazelcast.config.Config;
import com.hazelcast.config.JoinConfig;
import com.hazelcast.core.Hazelcast;
import com.hazelcast.core.HazelcastInstance;
import java.time.Clock;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tutor.chat.cobrowse.presence.HazelcastPresenceStore;
import tutor.chat.cobrowse.presence.LocalPresenceStore;
import tutor.chat.cobrowse.presence.PresenceStore;
import tutor.chat.cobrowse.relay.ControlHandler;
import tutor.chat.cobrowse.relay.HazelcastMessageRelay;
import tutor.chat.cobrowse.relay.LocalBroker;
import tutor.chat.cobrowse.relay.LocalMessageRelay;
import tutor.chat.cobrowse.relay.MessageRelay;
import tutor.chat.cobrowse.room.DefaultRoomAccessPolicy;
import tutor.chat.cobrowse.room.RoomAccessPolicy;
import tutor.chat.cobrowse.room.RoomStore;

/**
 * "서버 1대 모드"와 "클러스터 모드"를 설정 하나(chat.cluster.enabled)로 바꾼다.
 * 나머지 코드(컨트롤러, 인터셉터, presence)는 인터페이스만 보므로 어느 모드인지 모른다.
 */
@Configuration
public class StoreConfig {

    /** 접근 정책은 모드와 무관. 고객사 전용 정책이 필요하면 이 Bean 만 교체한다 (05장). */
    @Bean
    public RoomAccessPolicy roomAccessPolicy(RoomStore rooms) {
        return new DefaultRoomAccessPolicy(rooms);
    }

    // ── 서버 1대: 전부 로컬 메모리 ─────────────────────────────────────
    @Configuration
    @ConditionalOnProperty(name = "chat.cluster.enabled", havingValue = "false", matchIfMissing = true)
    static class Local {
        @Bean
        RoomStore roomStore() {
            return new RoomStore(new ConcurrentHashMap<>());
        }

        @Bean
        PresenceStore presenceStore(Clock clock) {
            return new LocalPresenceStore(clock);
        }

        @Bean
        MessageRelay messageRelay(LocalBroker broker, ControlHandler control) {
            return new LocalMessageRelay(broker, control);
        }
    }

    // ── 서버 N대: Hazelcast 로 공유 ───────────────────────────────────
    @Configuration
    @ConditionalOnProperty(name = "chat.cluster.enabled", havingValue = "true")
    static class Cluster {

        /**
         * 임베디드 Hazelcast: 별도 서버 없이 우리 Spring 앱 "안에서" Hazelcast 멤버가 뜬다.
         * 앱 N개 = Hazelcast 멤버 N개가 서로 찾아 하나의 클러스터가 된다.
         * (반대 방식: Hazelcast 를 별도 클러스터로 운영하고 앱은 클라이언트로 붙기 — 앱과 데이터의 수명을 분리할 때)
         */
        @Bean(destroyMethod = "shutdown")
        HazelcastInstance hazelcast(@Value("${chat.cluster.name}") String clusterName,
                                    @Value("${chat.cluster.port}") int port,
                                    @Value("${chat.cluster.members}") List<String> members,
                                    @Value("${chat.node-id}") String nodeId) {
            Config config = new Config();
            config.setClusterName(clusterName); // 이름이 같은 멤버끼리만 합쳐진다 (dev/prod 섞임 방지)
            config.setInstanceName(nodeId);
            config.setProperty("hazelcast.logging.type", "slf4j");
            config.setProperty("hazelcast.phone.home.enabled", "false");
            // 멤버가 사라졌다고 판단하기까지의 시간 (기본 60초는 실습에 너무 길다)
            config.setProperty("hazelcast.max.no.heartbeat.seconds", "10");

            config.getNetworkConfig().setPort(port).setPortAutoIncrement(true);
            JoinConfig join = config.getNetworkConfig().getJoin();
            // 멀티캐스트(같은 네트워크 자동 탐색)는 클라우드·사내망에서 막혀 있는 경우가 많다 → 주소를 명시
            join.getMulticastConfig().setEnabled(false);
            join.getTcpIpConfig().setEnabled(true).setMembers(members);
            return Hazelcast.newHazelcastInstance(config);
        }

        @Bean
        RoomStore roomStore(HazelcastInstance hz) {
            return new RoomStore(hz.getMap("rooms")); // IMap 은 ConcurrentMap 이다
        }

        @Bean
        PresenceStore presenceStore(HazelcastInstance hz) {
            return new HazelcastPresenceStore(hz.getMap("presence"));
        }

        @Bean
        MessageRelay messageRelay(HazelcastInstance hz, LocalBroker broker, ControlHandler control,
                                  @Value("${chat.node-id}") String nodeId) {
            return new HazelcastMessageRelay(hz, broker, control, nodeId);
        }
    }
}
