package tutor.chat.rawws;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.time.Duration;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.PingMessage;
import org.springframework.web.socket.WebSocketSession;

/**
 * 연결 유지(keep-alive)와 "죽은 연결" 정리.
 *
 * <p>왜 필요한가? TCP 연결은 상대가 사라져도(와이파이 끊김, 노트북 덮개 닫음) 바로 알 수 없다.
 * 클로즈 프레임도 FIN 패킷도 안 오면 서버는 그 세션이 살아 있다고 믿고 메모리를 계속 잡고 있다.
 * 또 중간의 프록시/로드밸런서는 "한동안 조용한 연결"을 임의로 끊는다(예: nginx 기본 60초).
 *
 * <p>그래서 주기적으로 ping 을 보내 (1) 조용한 연결에 트래픽을 흘려 프록시가 안 끊게 하고
 * (2) pong 이 오래 안 오면 죽은 연결로 판단해 서버 쪽에서 정리한다.
 *
 * <p>09장 STOMP heartbeat 는 같은 목적을 "STOMP 계층"에서 하는 것이다.
 */
@Component
public class KeepAliveTask {

    private static final Logger log = LoggerFactory.getLogger(KeepAliveTask.class);

    private final RoomHandler roomHandler;
    private final Duration idleTimeout;

    public KeepAliveTask(RoomHandler roomHandler, @Value("${chat.idle-timeout}") Duration idleTimeout) {
        this.roomHandler = roomHandler;
        this.idleTimeout = idleTimeout;
    }

    @Scheduled(fixedDelayString = "${chat.ping-interval}")
    public void pingAll() {
        Instant now = Instant.now();
        for (WebSocketSession s : roomHandler.allSessions()) {
            Instant lastPong = (Instant) s.getAttributes().get(RoomHandler.LAST_PONG);
            try {
                if (lastPong != null && Duration.between(lastPong, now).compareTo(idleTimeout) > 0) {
                    log.debug("pong 없음 → 종료 session={}", s.getId());
                    // 4500 = Spring 이 정의한 "세션 신뢰 불가" 코드. 4000~4999 는 애플리케이션이 자유롭게 쓰는 범위다.
                    s.close(CloseStatus.SESSION_NOT_RELIABLE);
                } else if (s.isOpen()) {
                    s.sendMessage(new PingMessage(ByteBuffer.wrap(new byte[0])));
                }
            } catch (IOException | IllegalStateException e) {
                log.debug("ping 실패 session={} : {}", s.getId(), e.getMessage());
            }
        }
    }
}
