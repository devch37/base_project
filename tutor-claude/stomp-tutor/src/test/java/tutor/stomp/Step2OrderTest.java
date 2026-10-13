package tutor.stomp;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

/**
 * 2단계 함정: 한 사람이 빠르게 보낸 메시지가 "보낸 순서대로" 도착하는가?
 * Spring 은 기본적으로 한 연결에서 온 메시지도 여러 스레드로 나눠 처리해서 순서가 섞일 수 있다.
 * StompConfig 의 setPreserveReceiveOrder / setPreservePublishOrder 가 이를 막는다.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class Step2OrderTest {

    @LocalServerPort int port;

    @Test
    void 한_사람이_빠르게_보낸_메시지는_순서대로_도착하고_저장된다() throws Exception {
        var sender = new TestStompClient(port);
        var receiver = new TestStompClient(port);
        var q = receiver.subscribe("/topic/rooms/order");

        int n = 300;
        for (int i = 1; i <= n; i++) sender.send("order", "철수", String.valueOf(i));

        List<Integer> got = new ArrayList<>();
        for (int i = 0; i < n; i++) got.add(Integer.parseInt((String) TestStompClient.nextMessage(q).get("text")));
        int outOfOrder = 0;
        for (int i = 1; i < n; i++) if (got.get(i) < got.get(i - 1)) outOfOrder++;
        System.out.println("[Step2OrderTest] 순서 뒤바뀜 " + outOfOrder + " / " + n);
        assertThat(outOfOrder).isZero();
    }
}
