package tutor.chat.cobrowse.auth;

// (secure-chat 모듈의 같은 이름 클래스와 동일. 설명 주석은 그쪽(10~12장)을 참고)

import java.time.Clock;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 주기적으로 "토큰은 만료됐는데 소켓은 열려 있는" 연결을 찾아 끊는다.
 *
 * <p>프레임마다 만료를 검사하는 것만으로는 부족한 이유:
 * 조용히 "구독만" 하고 있는 연결은 프레임을 보내지 않으므로 검사할 기회가 없다.
 * 그 사이 브로커는 계속 메시지를 보내 준다 → 만료된 사용자가 계속 엿듣는다.
 *
 * <p>close code 4001 로 끊어서, 클라이언트가 "네트워크 문제로 끊김(재연결 시도)"과
 * "토큰 만료(새 토큰 받아서 재연결)"를 구분할 수 있게 한다.
 */
@Component
public class ExpiredSessionSweeper {

    private static final Logger log = LoggerFactory.getLogger(ExpiredSessionSweeper.class);

    private final SessionRegistry sessions;
    private final Clock clock;

    public ExpiredSessionSweeper(SessionRegistry sessions, Clock clock) {
        this.sessions = sessions;
        this.clock = clock;
    }

    @Scheduled(fixedDelayString = "${chat.expiry-sweep-interval}")
    public void sweep() {
        Instant now = clock.instant();
        sessions.authenticatedUsers().forEach((sessionId, user) -> {
            if (user.isExpired(now)) {
                log.debug("토큰 만료로 연결 종료 session={} user={}", sessionId, user.getName());
                sessions.close(sessionId, SessionRegistry.TOKEN_EXPIRED);
            }
        });
    }
}
