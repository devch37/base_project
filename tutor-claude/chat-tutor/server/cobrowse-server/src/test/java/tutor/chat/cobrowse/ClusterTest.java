package tutor.chat.cobrowse;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.net.ServerSocket;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import tutor.chat.cobrowse.presence.PresenceEntry;
import tutor.chat.cobrowse.presence.PresenceStore;

/**
 * 23장: 서버 2대(A, B)를 한 JVM 안에 띄워 Hazelcast 클러스터로 묶고,
 * "고객은 A, 상담사는 B" 상황에서 화면·명령·상태가 제대로 오가는지 확인한다.
 */
class ClusterTest {

    static ConfigurableApplicationContext nodeA;
    static ConfigurableApplicationContext nodeB;
    static int portA;
    static int portB;

    static int freePort() throws IOException {
        try (ServerSocket s = new ServerSocket(0)) {
            return s.getLocalPort();
        }
    }

    static ConfigurableApplicationContext start(String nodeId, int hzPort, String members, String cluster) {
        // 주의: builder.properties(..) 는 "기본값" 취급이라 application.yml 에 밀린다.
        // 명령행 인자(--key=value)는 우선순위가 가장 높다 (04장 외부 설정 우선순위).
        return new SpringApplicationBuilder(CobrowseServerApplication.class).run(
                "--server.port=0",
                "--chat.node-id=" + nodeId,
                "--chat.cluster.enabled=true",
                "--chat.cluster.name=" + cluster, // 테스트마다 다른 클러스터 이름 → 개발 중 띄운 서버와 섞이지 않게
                "--chat.cluster.port=" + hzPort,
                "--chat.cluster.members=" + members,
                "--chat.presence.ttl=3s",
                "--chat.presence.refresh-interval=1s");
    }

    static int httpPort(ConfigurableApplicationContext ctx) {
        return Integer.parseInt(ctx.getEnvironment().getProperty("local.server.port"));
    }

    @BeforeAll
    static void startCluster() throws Exception {
        int hzA = freePort();
        int hzB = freePort();
        String members = "127.0.0.1:" + hzA + ",127.0.0.1:" + hzB;
        String cluster = "test-" + UUID.randomUUID();
        nodeA = start("node-A", hzA, members, cluster);
        nodeB = start("node-B", hzB, members, cluster);
        portA = httpPort(nodeA);
        portB = httpPort(nodeB);
    }

    @AfterAll
    static void stop() {
        if (nodeB != null) nodeB.close();
        if (nodeA != null) nodeA.close();
    }

    @Test
    void 두_노드가_하나의_클러스터를_이룬다() {
        var node = new org.springframework.web.client.RestTemplate()
                .getForObject("http://localhost:" + portB + "/api/public/node", java.util.Map.class);
        assertThat(node.get("clusterMembers")).isEqualTo(2);
    }

    @Test
    void A에서_만든_방을_B가_안다_IMap_공유상태() {
        String room = new Tenant(portA, "dev-acme-key").createRoom("c-1");
        // 같은 방에 대한 토큰을 B 에게 발급받을 수 있다 = B 도 그 방을 안다
        String token = new Tenant(portB, "dev-acme-key").customerToken("c-1", room);
        assertThat(token).isNotBlank();
    }

    @Test
    void 고객은_A_상담사는_B에_붙어도_화면과_명령이_오간다_그리고_중복은_없다() throws Exception {
        Tenant tenantA = new Tenant(portA, "dev-acme-key");
        String room = tenantA.createRoom("c-2");
        tenantA.assign(room, "agent-1");

        TestStomp customer = TestStomp.connect(portA, tenantA.customerToken("c-2", room));
        TestStomp agent = TestStomp.connect(portB, tenantA.agentToken("agent-1"));
        var commands = customer.subscribeRaw("/topic/cobrowse/" + room + "/commands");
        var status = agent.subscribeRaw("/topic/rooms/" + room + "/status");
        Thread.sleep(300);
        var screen = agent.subscribeRaw("/topic/cobrowse/" + room + "/screen");

        // B 에서 일어난 구독이 A 에 있는 고객에게 "스냅샷 보내 줘"로 전달된다
        assertThat(TestStomp.nextJson(commands, m -> "resync".equals(m.get("type"))).get("reason")).isEqualTo("viewer-joined");

        customer.sendRaw("/app/cobrowse/" + room + "/frame", "{\"k\":\"f\",\"seq\":1}");
        assertThat(screen.poll(5, TimeUnit.SECONDS)).isNotNull();
        assertThat(screen.poll(700, TimeUnit.MILLISECONDS)).as("같은 프레임이 두 번 오면 안 된다").isNull();

        // presence 에 두 노드가 모두 보인다
        var presence = TestStomp.nextJson(status, m -> "presence".equals(m.get("type"))
                && ((List<?>) m.get("nodes")).size() == 2);
        assertThat(presence.get("nodes")).asString().contains("node-A").contains("node-B");
    }

    @Test
    void A로_보낸_강제퇴장이_B에_붙은_연결을_끊는다() throws Exception {
        Tenant tenantA = new Tenant(portA, "dev-acme-key");
        TestStomp agentOnB = TestStomp.connect(portB, tenantA.agentToken("agent-kick"));
        tenantA.call(org.springframework.http.HttpMethod.POST, "/internal/users/agent-kick/kick", null);
        assertThat(agentOnB.awaitDisconnected(5000)).isTrue();
    }

    @Test
    void 갱신이_멈춘_presence는_TTL이_지나면_사라진다_서버가_죽은_상황() throws Exception {
        PresenceStore storeOnB = nodeB.getBean(PresenceStore.class);
        PresenceStore storeOnA = nodeA.getBean(PresenceStore.class);

        // "죽은 노드 C" 가 남긴 항목이라고 가정: 아무도 갱신하지 않는다
        storeOnB.put("ghost|1", new PresenceEntry("r-ghost", "agent-x", "AGENT", "screen", "node-C"), Duration.ofSeconds(1));
        assertThat(storeOnA.inRoom("r-ghost")).hasSize(1); // 다른 노드에서도 보인다 (공유 상태)

        Thread.sleep(2000);
        assertThat(storeOnA.inRoom("r-ghost")).as("TTL 만료로 자동 삭제").isEmpty();
    }
}
