package tutor.chat.stomp;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import org.springframework.web.socket.messaging.SessionUnsubscribeEvent;

/**
 * 입장/퇴장(presence) 추적.
 *
 * <p>"누가 방에 있는가"를 SUBSCRIBE/UNSUBSCRIBE/DISCONNECT 이벤트로 알아낸다.
 * 특히 DISCONNECT 는 다음 경우 모두에 온다 — 09장의 핵심:
 * <ol>
 *   <li>클라이언트가 DISCONNECT 프레임을 보냄 (정상 종료)</li>
 *   <li>브라우저 탭 닫힘 → WebSocket close</li>
 *   <li>heartbeat 가 끊겨 서버가 연결을 정리함 (네트워크 단절 — 클로즈 프레임조차 없음)</li>
 * </ol>
 * 3번이 없으면 "유령 참가자"가 방에 영원히 남는다.
 */
@Component
public class PresenceTracker {

    private static final Logger log = LoggerFactory.getLogger(PresenceTracker.class);
    private static final Pattern ROOM_TOPIC = Pattern.compile("^/topic/rooms/([^/]+)$");

    private final SimpMessagingTemplate messaging;
    private final ChatHistory history;
    /** sessionId → (subscriptionId → roomId) */
    private final Map<String, Map<String, String>> subscriptions = new ConcurrentHashMap<>();
    /** roomId → sessionIds */
    private final Map<String, Set<String>> members = new ConcurrentHashMap<>();

    public PresenceTracker(SimpMessagingTemplate messaging, ChatHistory history) {
        this.messaging = messaging;
        this.history = history;
    }

    @EventListener
    public void onSubscribe(SessionSubscribeEvent event) {
        StompHeaderAccessor h = StompHeaderAccessor.wrap(event.getMessage());
        Matcher m = ROOM_TOPIC.matcher(String.valueOf(h.getDestination()));
        if (!m.matches()) return;
        String roomId = m.group(1);
        subscriptions.computeIfAbsent(h.getSessionId(), k -> new ConcurrentHashMap<>()).put(h.getSubscriptionId(), roomId);
        members.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet()).add(h.getSessionId());
        announce(roomId, "입장");
    }

    @EventListener
    public void onUnsubscribe(SessionUnsubscribeEvent event) {
        StompHeaderAccessor h = StompHeaderAccessor.wrap(event.getMessage());
        Map<String, String> subs = subscriptions.get(h.getSessionId());
        if (subs == null) return;
        String roomId = subs.remove(h.getSubscriptionId());
        if (roomId != null) leave(roomId, h.getSessionId());
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        log.debug("[DISCONNECT] session={} closeStatus={}", event.getSessionId(), event.getCloseStatus());
        Map<String, String> subs = subscriptions.remove(event.getSessionId());
        if (subs == null) return;
        subs.values().stream().distinct().forEach(roomId -> leave(roomId, event.getSessionId()));
    }

    private void leave(String roomId, String sessionId) {
        Set<String> s = members.get(roomId);
        if (s == null) return;
        s.remove(sessionId);
        members.computeIfPresent(roomId, (k, v) -> v.isEmpty() ? null : v);
        announce(roomId, "퇴장");
    }

    private void announce(String roomId, String what) {
        int count = members.getOrDefault(roomId, Set.of()).size();
        ChatMessage m = history.append(roomId, "system", "system", what + " (현재 " + count + "명)");
        // 컨트롤러 return 이 아니어도, SimpMessagingTemplate 으로 "서버가 먼저" 보낼 수 있다.
        messaging.convertAndSend("/topic/rooms/" + roomId, m);
    }

    public int count(String roomId) {
        return members.getOrDefault(roomId, Set.of()).size();
    }
}
