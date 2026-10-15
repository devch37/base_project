package tutor.chat.cobrowse.relay;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import tutor.chat.cobrowse.auth.SessionRegistry;

/** 각 노드에서 제어 명령을 실제로 수행 — "내 로컬 연결" 중 해당자만 처리한다. */
@Component
public class ControlHandler {

    private static final Logger log = LoggerFactory.getLogger(ControlHandler.class);
    private final SessionRegistry sessions;

    public ControlHandler(SessionRegistry sessions) {
        this.sessions = sessions;
    }

    public void handle(ControlEvent e) {
        if ("kick".equals(e.type())) {
            int n = sessions.closeUser(e.tenant(), e.userId(), SessionRegistry.KICKED);
            if (n > 0) log.info("강제 퇴장 user={}:{} closed={}", e.tenant(), e.userId(), n);
        }
    }
}
