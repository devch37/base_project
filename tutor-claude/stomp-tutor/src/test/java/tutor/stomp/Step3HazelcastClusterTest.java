package tutor.stomp;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.net.ServerSocket;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.web.client.RestTemplate;

/**
 * 3단계: 서버 2대(A, B)를 한 JVM 에 띄워 Hazelcast 로 묶는다.
 * 철수는 A, 영희는 B 에 붙었을 때도 대화가 되는지 확인한다.
 */
class Step3HazelcastClusterTest {

    static ConfigurableApplicationContext a;
    static ConfigurableApplicationContext b;
    static int portA;
    static int portB;

    static int freePort() throws IOException {
        try (ServerSocket s = new ServerSocket(0)) {
            return s.getLocalPort();
        }
    }

    static ConfigurableApplicationContext start(int hzPort, String members, String cluster) {
        // 명령행 인자(--)로 넘겨야 application.yml 값보다 우선한다
        return new SpringApplicationBuilder(StompTutorApplication.class).run(
                "--server.port=0",
                "--app.hazelcast.enabled=true",
                "--app.hazelcast.port=" + hzPort,
                "--app.hazelcast.members=" + members,
                "--app.hazelcast.cluster-name=" + cluster); // 테스트마다 다른 이름 → 실습용 서버와 섞이지 않게
    }

    static int port(ConfigurableApplicationContext ctx) {
        return Integer.parseInt(ctx.getEnvironment().getProperty("local.server.port"));
    }

    @BeforeAll
    static void startTwoServers() throws Exception {
        int hzA = freePort();
        int hzB = freePort();
        String members = "127.0.0.1:" + hzA + ",127.0.0.1:" + hzB;
        String cluster = "test-" + UUID.randomUUID();
        a = start(hzA, members, cluster);
        b = start(hzB, members, cluster);
        portA = port(a);
        portB = port(b);
    }

    @AfterAll
    static void stop() {
        if (b != null) b.close();
        if (a != null) a.close();
    }

    @Test
    void 두_서버가_하나의_클러스터가_된다() {
        var info = new RestTemplate().getForObject("http://localhost:" + portA + "/api/info", java.util.Map.class);
        assertThat(info.get("clusterMembers")).isEqualTo(2);
    }

    @Test
    void A에_붙은_철수의_메시지가_B에_붙은_영희에게_한_번만_간다_Topic() throws Exception {
        var chulsoo = new TestStompClient(portA);
        var younghee = new TestStompClient(portB);
        var yq = younghee.subscribe("/topic/rooms/cluster");
        var cq = chulsoo.subscribe("/topic/rooms/cluster");

        chulsoo.send("cluster", "철수", "다른 서버에 있어도 들려?");

        var got = TestStompClient.nextMessage(yq);
        assertThat(got.get("text")).isEqualTo("다른 서버에 있어도 들려?");
        assertThat(got.get("receivedBy")).isEqualTo(portA); // A 가 받아서 Hazelcast 로 B 에 전달
        assertThat(TestStompClient.nextMessage(cq).get("text")).isEqualTo("다른 서버에 있어도 들려?");
        assertThat(cq.poll(500, TimeUnit.MILLISECONDS)).as("보낸 쪽(A)도 중복 없이 한 번만").isNull();
    }

    @Test
    void A에서_쌓인_대화를_B에_새로_들어온_사람도_본다_IMap() throws Exception {
        var chulsoo = new TestStompClient(portA);
        chulsoo.subscribe("/topic/rooms/shared-history");
        chulsoo.send("shared-history", "철수", "A 에서 한 말");
        Thread.sleep(300);

        var late = new TestStompClient(portB);
        String list = late.subscribe("/app/rooms/shared-history/history").poll(5, TimeUnit.SECONDS);
        assertThat(list).contains("A 에서 한 말");
    }
}
