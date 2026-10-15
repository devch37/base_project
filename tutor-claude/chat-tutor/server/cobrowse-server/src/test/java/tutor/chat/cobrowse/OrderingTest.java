package tutor.chat.cobrowse;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

/**
 * 19장: 한 고객이 빠르게 보낸 프레임 N 개가 상담사에게 "보낸 순서대로" 도착하는가?
 *
 * Spring 은 기본적으로 한 연결에서 온 메시지라도 clientInboundChannel 의 "여러 스레드"로 나눠 처리하고,
 * 브로커에서 나가는 메시지도 여러 스레드로 보낸다. → 순서가 뒤바뀔 수 있다.
 * StompConfig 의 setPreserveReceiveOrder / setPreservePublishOrder 가 이를 막는다.
 * (application.yml 의 chat.preserve-order=false 로 끄고 이 테스트를 돌려 보면 차이를 볼 수 있다)
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class OrderingTest {

    @LocalServerPort int port;

    @Test
    void 한_고객이_보낸_프레임은_순서대로_도착한다() throws Exception {
        Tenant tenant = new Tenant(port, "dev-acme-key");
        String room = tenant.createRoom("c-order");
        tenant.assign(room, "agent-o");
        TestStomp customer = TestStomp.connect(port, tenant.customerToken("c-order", room));
        TestStomp agent = TestStomp.connect(port, tenant.agentToken("agent-o"));
        var screen = agent.subscribeRaw("/topic/cobrowse/" + room + "/screen");
        Thread.sleep(300);

        int n = 2000;
        for (int i = 1; i <= n; i++) {
            customer.sendRaw("/app/cobrowse/" + room + "/frame", "{\"k\":\"f\",\"seq\":" + i + "}");
        }
        List<Integer> got = new ArrayList<>();
        while (got.size() < n) {
            byte[] b = screen.poll(10, TimeUnit.SECONDS);
            assertThat(b).as("받은 개수 %d", got.size()).isNotNull();
            got.add(((Number) TestStomp.JSON.readValue(b, java.util.Map.class).get("seq")).intValue());
        }
        int outOfOrder = 0;
        for (int i = 1; i < got.size(); i++) if (got.get(i) < got.get(i - 1)) outOfOrder++;
        System.out.println("[OrderingTest] 순서 뒤바뀜 횟수 = " + outOfOrder + " / " + n);
        assertThat(outOfOrder).isZero();
    }
}
