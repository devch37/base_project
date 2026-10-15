package tutor.chat.cobrowse;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

/**
 * 서버 1대에서 co-browsing 의 전체 메시지 흐름을 확인한다.
 * (브라우저 SDK 를 포함한 진짜 화면 동기화는 web/e2e 의 Playwright 테스트가 확인한다)
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CobrowseFlowTest {

    @LocalServerPort int port;
    Tenant tenant;
    String room;
    TestStomp customer;
    TestStomp agent;

    @BeforeEach
    void setUp() throws Exception {
        tenant = new Tenant(port, "dev-acme-key");
        room = tenant.createRoom("c-1");
        tenant.assign(room, "agent-1");
        customer = TestStomp.connect(port, tenant.customerToken("c-1", room));
        agent = TestStomp.connect(port, tenant.agentToken("agent-1"));
    }

    @Test
    void 상담사가_화면을_구독하면_고객에게_스냅샷_요청이_가고_고객_프레임은_그대로_중계된다() throws Exception {
        var commands = customer.subscribeRaw("/topic/cobrowse/" + room + "/commands");
        Thread.sleep(200);
        var screen = agent.subscribeRaw("/topic/cobrowse/" + room + "/screen");

        var resync = TestStomp.nextJson(commands, m -> "resync".equals(m.get("type")));
        assertThat(resync.get("reason")).isEqualTo("viewer-joined");

        String frame = "{\"k\":\"f\",\"epoch\":\"e1\",\"seq\":1,\"type\":\"snapshot\",\"data\":{\"한글\":\"그대로\"}}";
        customer.sendRaw("/app/cobrowse/" + room + "/frame", frame);
        byte[] got = screen.poll(5, TimeUnit.SECONDS);
        assertThat(got).isNotNull();
        // 서버는 바이트 하나 바꾸지 않고 중계한다
        assertThat(Arrays.equals(got, frame.getBytes(StandardCharsets.UTF_8))).isTrue();
    }

    @Test
    void 고객_동의_전에는_원격명령이_거절되지만_연결은_유지되고_동의_후에는_전달된다() throws Exception {
        var commands = customer.subscribeRaw("/topic/cobrowse/" + room + "/commands");
        var status = agent.subscribeRaw("/topic/rooms/" + room + "/status");
        var agentErrors = agent.subscribeRaw("/user/queue/errors");
        Thread.sleep(200);

        agent.sendRaw("/app/cobrowse/" + room + "/command", "{\"type\":\"click\",\"id\":5}");
        assertThat(TestStomp.nextJson(agentErrors, m -> true).get("error").toString()).contains("허용하지 않았습니다");
        assertThat(agent.session.isConnected()).as("업무 규칙 거절은 연결을 끊지 않는다").isTrue();

        customer.sendRaw("/app/cobrowse/" + room + "/consent", "{\"remoteControl\":true}");
        assertThat(TestStomp.nextJson(status, m -> "consent".equals(m.get("type"))).get("remoteControl")).isEqualTo(true);

        agent.sendRaw("/app/cobrowse/" + room + "/command", "{\"type\":\"click\",\"id\":5,\"by\":\"사칭\"}");
        var cmd = TestStomp.nextJson(commands, m -> "click".equals(m.get("type")));
        assertThat(cmd.get("by")).as("서버가 by 를 덮어쓴다").isEqualTo("agent-1");
        assertThat(cmd.get("cmdId")).isNotNull();
    }

    @Test
    void 역할이_다른_채널은_구독할_수_없다_고객은_screen_구독불가() throws Exception {
        customer.subscribeRaw("/topic/cobrowse/" + room + "/screen");
        // 권한 위반 → 서버가 1008(Policy Violation)로 연결을 끊는다
        assertThat(customer.awaitDisconnected(3000)).isTrue();
    }

    @Test
    void 상담사는_가짜_화면을_보낼_수_없다() throws Exception {
        var screen = agent.subscribeRaw("/topic/cobrowse/" + room + "/screen");
        Thread.sleep(200);
        agent.sendRaw("/app/cobrowse/" + room + "/frame", "{\"k\":\"f\",\"fake\":true}");
        assertThat(agent.awaitDisconnected(3000)).isTrue();
        assertThat(screen.poll(500, java.util.concurrent.TimeUnit.MILLISECONDS)).as("가짜 화면은 중계되지 않았다").isNull();
    }

    @Test
    void 허용되지_않은_명령_종류는_거절된다() throws Exception {
        customer.sendRaw("/app/cobrowse/" + room + "/consent", "{\"remoteControl\":true}");
        var errors = agent.subscribeRaw("/user/queue/errors");
        Thread.sleep(200);
        agent.sendRaw("/app/cobrowse/" + room + "/command", "{\"type\":\"eval\",\"code\":\"alert(1)\"}");
        assertThat(TestStomp.nextJson(errors, m -> true).get("error")).isEqualTo("허용되지 않은 명령");
    }

    @Test
    void 크기_한도_안의_큰_프레임은_통과하고_넘으면_연결이_끊긴다() throws Exception {
        var screen = agent.subscribeRaw("/topic/cobrowse/" + room + "/screen");
        Thread.sleep(200);

        String big = "{\"k\":\"c\",\"d\":\"" + "A".repeat(100_000) + "\"}"; // ≈100KB < 128KB
        customer.sendRaw("/app/cobrowse/" + room + "/frame", big);
        byte[] got = screen.poll(5, TimeUnit.SECONDS);
        assertThat(got).isNotNull();
        assertThat(got.length).isEqualTo(big.length());

        String tooBig = "{\"k\":\"c\",\"d\":\"" + "A".repeat(200_000) + "\"}"; // > 128KB
        customer.sendRaw("/app/cobrowse/" + room + "/frame", tooBig);
        assertThat(customer.awaitDisconnected(5000)).as("한도를 넘으면 서버가 연결을 끊는다 → SDK 는 조각을 내야 한다").isTrue();
    }

    @Test
    void 채팅은_고객과_상담사_모두_주고받는다() throws Exception {
        var agentChat = agent.subscribeRaw("/topic/rooms/" + room + "/chat");
        Thread.sleep(200);
        customer.sendRaw("/app/rooms/" + room + "/chat", "{\"text\":\"화면 좀 봐 주세요\"}");
        var m = TestStomp.nextJson(agentChat, x -> "chat".equals(x.get("type")));
        assertThat(m.get("from")).isEqualTo("c-1");
        assertThat(m.get("role")).isEqualTo("CUSTOMER");
        assertThat(m.get("id")).isNotNull();
    }

    @Test
    void 위조_토큰의_CONNECT는_응답없이_매달리지_않고_바로_끊긴다() {
        String forged = tenant.customerToken("c-1", room);
        forged = forged.substring(0, forged.length() - 4) + "AAAA";
        String bad = forged;
        long start = System.currentTimeMillis();
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> TestStomp.connect(port, bad)).isNotNull();
        assertThat(System.currentTimeMillis() - start).as("5초 타임아웃까지 기다리지 않는다").isLessThan(4000);
    }
}
