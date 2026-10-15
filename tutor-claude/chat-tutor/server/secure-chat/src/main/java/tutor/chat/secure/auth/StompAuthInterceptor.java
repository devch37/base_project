package tutor.chat.secure.auth;

import java.time.Clock;
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
import tutor.chat.secure.room.RoomAccessPolicy;
import tutor.chat.secure.room.RoomAction;

/**
 * 12장의 주인공: 클라이언트 → 서버로 들어오는 "모든 STOMP 프레임"의 관문.
 *
 * <p>왜 HTTP 핸드셰이크가 아니라 여기서 인증하나?
 * <ul>
 *   <li>브라우저의 new WebSocket(url) 은 Authorization 헤더를 붙일 수 없다.</li>
 *   <li>URL 쿼리(?token=..)로 보내면 프록시·서버 접근 로그에 토큰이 그대로 남는다.</li>
 *   <li>STOMP CONNECT 프레임에는 헤더를 자유롭게 넣을 수 있다 → Authorization: Bearer ...</li>
 * </ul>
 *
 * <p>위치: clientInboundChannel 의 인터셉터 = 컨트롤러(@MessageMapping)와 브로커(/topic)보다 "앞".
 * 여기서 예외를 던지면 메시지는 어디에도 전달되지 않고, 클라이언트는 ERROR 프레임을 받는다.
 *
 * <pre>
 *   브라우저 ──프레임──▶ [이 인터셉터] ──▶ /app/** → @MessageMapping
 *                                       └─▶ /topic/** → 브로커 (SUBSCRIBE 등록)
 * </pre>
 */
@Component
public class StompAuthInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(StompAuthInterceptor.class);

    // 허용하는 목적지 "화이트리스트". 여기에 없는 주소는 전부 거부 (default deny).
    private static final Pattern SUB_ROOM = Pattern.compile("^/topic/rooms/([A-Za-z0-9_-]+)(/[a-z-]+)?$");
    private static final Pattern SUB_HISTORY = Pattern.compile("^/app/rooms/([A-Za-z0-9_-]+)/history$");
    private static final Pattern SUB_USER_QUEUE = Pattern.compile("^/user/queue/[a-z-]+$");
    private static final Pattern SEND_CHAT = Pattern.compile("^/app/rooms/([A-Za-z0-9_-]+)/send$");
    private static final Pattern SEND_CLOSE = Pattern.compile("^/app/rooms/([A-Za-z0-9_-]+)/close$");
    private static final String SEND_REFRESH = "/app/token/refresh";

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
        // getAccessor 로 "같은 헤더 객체"를 얻어야 setUser 가 이후 처리에 반영된다 (wrap 은 복사본)
        StompHeaderAccessor h = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (h == null || h.getCommand() == null) return message; // heartbeat 등

        StompCommand cmd = h.getCommand();
        switch (cmd) {
            case CONNECT -> connect(h);
            case SUBSCRIBE -> subscribe(h);
            case SEND -> send(h);
            default -> { /* UNSUBSCRIBE, DISCONNECT, ACK... 는 통과 */ }
        }
        return message;
    }

    private void connect(StompHeaderAccessor h) {
        String auth = h.getFirstNativeHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            throw new MessageDeliveryException("인증 필요: CONNECT 에 Authorization: Bearer <token> 헤더를 넣으세요");
        }
        ChatPrincipal user;
        try {
            user = jwt.verify(auth.substring("Bearer ".length()));
        } catch (InvalidTokenException e) {
            log.debug("CONNECT 거부 session={} reason={}", h.getSessionId(), e.getMessage());
            throw new MessageDeliveryException("인증 실패: " + e.getMessage());
        }
        h.setUser(user); // 이 연결의 이후 모든 프레임에 이 사용자가 붙는다
        sessions.authenticated(h.getSessionId(), user);
        log.debug("CONNECT 성공 session={} user={} role={}", h.getSessionId(), user.getName(), user.role());
    }

    private void subscribe(StompHeaderAccessor h) {
        ChatPrincipal user = requireLiveUser(h);
        String dest = String.valueOf(h.getDestination());

        if (SUB_USER_QUEUE.matcher(dest).matches()) return; // 자기 개인 큐는 항상 허용
        String roomId = match(SUB_ROOM, dest);
        if (roomId == null) roomId = match(SUB_HISTORY, dest);
        if (roomId == null) deny(h, "구독할 수 없는 주소: " + dest);
        if (!access.allowed(user, roomId, RoomAction.READ)) deny(h, "이 방을 볼 권한이 없습니다: " + roomId);
    }

    private void send(StompHeaderAccessor h) {
        ChatPrincipal user = requireLiveUser(h);
        String dest = String.valueOf(h.getDestination());

        if (SEND_REFRESH.equals(dest)) return; // 토큰 갱신은 컨트롤러가 검증
        // 핵심: /topic 으로 직접 SEND 하면 컨트롤러를 우회해 브로커가 바로 뿌린다 → 반드시 막는다
        String roomId = match(SEND_CHAT, dest);
        RoomAction action = RoomAction.WRITE;
        if (roomId == null) {
            roomId = match(SEND_CLOSE, dest);
            action = RoomAction.CLOSE;
        }
        if (roomId == null) deny(h, "보낼 수 없는 주소: " + dest);
        if (!access.allowed(user, roomId, action)) deny(h, action + " 권한이 없습니다: " + roomId);
    }

    /**
     * 토큰 만료 ≠ 연결 종료.
     * JWT 는 CONNECT 때 한 번 검증됐을 뿐, 시간이 지나 exp 를 넘겨도 소켓은 멀쩡히 열려 있다.
     * 그래서 (1) 프레임마다 만료를 다시 확인하고 (2) ExpiredSessionSweeper 가 주기적으로 연결을 끊는다.
     */
    private ChatPrincipal requireLiveUser(StompHeaderAccessor h) {
        // 토큰 갱신(/app/token/refresh)을 하면 SessionRegistry 쪽 정보가 최신이다
        ChatPrincipal user = sessions.authenticatedUsers().get(h.getSessionId());
        if (user == null && h.getUser() instanceof ChatPrincipal p) user = p;
        if (user == null) throw new MessageDeliveryException("인증되지 않은 연결");
        if (user.isExpired(clock.instant())) throw new MessageDeliveryException("토큰 만료: 다시 연결하세요");
        return user;
    }

    private static String match(Pattern p, String dest) {
        Matcher m = p.matcher(dest);
        return m.matches() ? m.group(1) : null;
    }

    private static void deny(StompHeaderAccessor h, String reason) {
        log.debug("거부 session={} cmd={} dest={} reason={}", h.getSessionId(), h.getCommand(), h.getDestination(), reason);
        throw new MessageDeliveryException(reason);
    }
}
