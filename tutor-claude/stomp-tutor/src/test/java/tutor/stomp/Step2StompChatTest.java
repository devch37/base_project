package tutor.stomp;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

/** 2단계: STOMP — 같은 방 구독자만 받는다, 늦게 온 사람은 history 로 지난 대화를 받는다 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class Step2StompChatTest {

    @LocalServerPort int port;

    @Test
    void 같은_방_구독자에게만_간다() throws Exception {
        var chulsoo = new TestStompClient(port);
        var younghee = new TestStompClient(port);
        var other = new TestStompClient(port);
        var cq = chulsoo.subscribe("/topic/rooms/lobby");
        var yq = younghee.subscribe("/topic/rooms/lobby");
        var oq = other.subscribe("/topic/rooms/other-room");

        chulsoo.send("lobby", "철수", "안녕");

        assertThat(TestStompClient.nextMessage(yq).get("text")).isEqualTo("안녕");
        assertThat(TestStompClient.nextMessage(cq).get("sender")).isEqualTo("철수");
        assertThat(oq.poll(500, TimeUnit.MILLISECONDS)).as("다른 방은 받지 않는다").isNull();
    }

    @Test
    void 늦게_들어온_사람은_SubscribeMapping으로_지난_대화를_받는다() throws Exception {
        var early = new TestStompClient(port);
        early.subscribe("/topic/rooms/history-room");
        early.send("history-room", "철수", "1번");
        early.send("history-room", "철수", "2번");
        Thread.sleep(300);

        var late = new TestStompClient(port);
        String list = late.subscribe("/app/rooms/history-room/history").poll(5, TimeUnit.SECONDS);
        assertThat(list).contains("1번").contains("2번");
    }

    @Test
    void SendTo는_return값을_구독자_전원에게_보낸다() throws Exception {
        var c = new TestStompClient(port);
        var q = c.subscribe("/topic/echo");
        c.session.send("/app/echo", "hello");
        assertThat(q.poll(5, TimeUnit.SECONDS)).contains("에코: hello");
    }
}
