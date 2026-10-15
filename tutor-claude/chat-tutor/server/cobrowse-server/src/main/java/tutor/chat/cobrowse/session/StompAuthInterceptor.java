package tutor.chat.cobrowse.session;

import java.time.Clock;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;
import tutor.chat.cobrowse.auth.ChatPrincipal;
import tutor.chat.cobrowse.auth.InvalidTokenException;
import tutor.chat.cobrowse.auth.JwtService;
import tutor.chat.cobrowse.auth.SessionRegistry;
import tutor.chat.cobrowse.room.RoomAccessPolicy;
import tutor.chat.cobrowse.room.RoomAction;

/**
 * 모든 STOMP 프레임의 관문 (secure-chat 의 같은 클래스를 co-browsing 주소 체계로 확장).
 * 주소 → 필요한 행동(RoomAction) 표를 두고, 표에 없는 주소는 전부 거부한다.
 *
 * <p>secure-chat 과 다른 점: 거부할 때 예외만 던지지 않고 "소켓을 직접 닫는다"(close code 포함).
 * 이 서버는 순서 보존(setPreserveReceiveOrder)을 켰는데, 이 모드에서는 인터셉터 예외가
 * ERROR 프레임으로 클라이언트에 가지 않고 서버 로그에만 남는다(실측 — 19장·12장 README).
 * 그러면 CONNECT 가 거부된 클라이언트는 영원히 응답을 기다린다. 그래서 명시적으로 닫는다.
 */
@Component
public class StompAuthInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(StompAuthInterceptor.class);

    private record Rule(Pattern pattern, RoomAction action) {}

    private static Rule rule(String regex, RoomAction action) {
        return new Rule(Pattern.compile(regex), action);
    }

    private static final String ROOM = "([A-Za-z0-9_-]{1,64})";

    private static final List<Rule> SUBSCRIBE_RULES = List.of(
            rule("^/topic/rooms/" + ROOM + "/chat$", RoomAction.CHAT_READ),
            rule("^/topic/rooms/" + ROOM + "/status$", RoomAction.STATUS_READ),
            rule("^/topic/cobrowse/" + ROOM + "/screen$", RoomAction.SCREEN_VIEW),
            rule("^/topic/cobrowse/" + ROOM + "/commands$", RoomAction.COMMAND_RECEIVE));

    private static final List<Rule> SEND_RULES = List.of(
            rule("^/app/rooms/" + ROOM + "/chat$", RoomAction.CHAT_WRITE),
            rule("^/app/rooms/" + ROOM + "/close$", RoomAction.CLOSE),
            rule("^/app/cobrowse/" + ROOM + "/frame$", RoomAction.SCREEN_SEND),
            rule("^/app/cobrowse/" + ROOM + "/command$", RoomAction.COMMAND_SEND),
            rule("^/app/cobrowse/" + ROOM + "/resync$", RoomAction.RESYNC_REQUEST),
            rule("^/app/cobrowse/" + ROOM + "/consent$", RoomAction.CONSENT));

    private static final Pattern USER_QUEUE = Pattern.compile("^/user/queue/[a-z-]+$");
    private static final String TOKEN_REFRESH = "/app/token/refresh";

    private final JwtService jwt;
    private final RoomAccessPolicy access;
    private final SessionRegistry sessions;
    private final Clock clock;

    public StompAuthInterceptor(JwtService jwt, RoomAccessPolicy access, SessionRegistry sessions, Clock clock) {
        this.jwt = jwt;
        this.access = access;
        this.sessions = sessions;
        this.clock = clock;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor h = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (h == null || h.getCommand() == null) return message;
        StompCommand cmd = h.getCommand();
        if (cmd == StompCommand.CONNECT) {
            connect(h);
        } else if (cmd == StompCommand.SUBSCRIBE) {
            String dest = String.valueOf(h.getDestination());
            if (!USER_QUEUE.matcher(dest).matches()) authorize(h, SUBSCRIBE_RULES, dest);
            else requireLiveUser(h);
        } else if (cmd == StompCommand.SEND) {
            String dest = String.valueOf(h.getDestination());
            if (!TOKEN_REFRESH.equals(dest)) authorize(h, SEND_RULES, dest);
            else requireLiveUser(h);
        }
        return message;
    }

    private void connect(StompHeaderAccessor h) {
        String auth = h.getFirstNativeHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) reject(h, SessionRegistry.UNAUTHORIZED, "인증 필요");
        try {
            ChatPrincipal user = jwt.verify(auth.substring(7));
            h.setUser(user);
            sessions.authenticated(h.getSessionId(), user);
        } catch (InvalidTokenException e) {
            reject(h, e.getMessage().contains("만료") ? SessionRegistry.TOKEN_EXPIRED : SessionRegistry.UNAUTHORIZED,
                    "인증 실패: " + e.getMessage());
        }
    }

    private void authorize(StompHeaderAccessor h, List<Rule> rules, String dest) {
        ChatPrincipal user = requireLiveUser(h);
        for (Rule r : rules) {
            Matcher m = r.pattern().matcher(dest);
            if (m.matches()) {
                if (access.allowed(user, m.group(1), r.action())) return;
                deny(h, r.action() + " 권한 없음: " + m.group(1));
            }
        }
        deny(h, "허용되지 않은 주소: " + dest);
    }

    private ChatPrincipal requireLiveUser(StompHeaderAccessor h) {
        ChatPrincipal user = sessions.user(h.getSessionId());
        if (user == null && h.getUser() instanceof ChatPrincipal p) user = p;
        if (user == null) reject(h, SessionRegistry.UNAUTHORIZED, "인증되지 않은 연결");
        if (user.isExpired(clock.instant())) reject(h, SessionRegistry.TOKEN_EXPIRED, "토큰 만료");
        return user;
    }

    /** 권한 위반: 보안 문제이므로 연결을 끊는다 (업무 규칙 거절은 컨트롤러가 /user/queue/errors 로) */
    private void deny(StompHeaderAccessor h, String reason) {
        reject(h, SessionRegistry.FORBIDDEN, reason);
    }

    private void reject(StompHeaderAccessor h, org.springframework.web.socket.CloseStatus status, String reason) {
        log.debug("거부 session={} cmd={} code={} reason={}", h.getSessionId(), h.getCommand(), status.getCode(), reason);
        sessions.close(h.getSessionId(), status);
        throw new MessageDeliveryException(reason); // 메시지는 어디에도 전달되지 않는다
    }
}
