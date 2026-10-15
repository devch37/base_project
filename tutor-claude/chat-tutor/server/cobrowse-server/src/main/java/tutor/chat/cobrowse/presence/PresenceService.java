package tutor.chat.cobrowse.presence;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import org.springframework.web.socket.messaging.SessionUnsubscribeEvent;
import tutor.chat.cobrowse.auth.ChatPrincipal;
import tutor.chat.cobrowse.relay.MessageRelay;

/**
 * 구독 이벤트로 "누가 화면을 보고/공유하고 있나"를 추적하고, 방 상태를 방송한다.
 *
 * <p>중요한 연쇄 반응: 상담사가 /topic/cobrowse/{room}/screen 을 구독하면
 * → 고객 SDK 에게 {type:"resync", reason:"viewer-joined"} 를 보낸다
 * → 고객 SDK 가 전체 스냅샷을 새로 보낸다.
 * 늦게 들어온 상담사는 "이전 변경분"을 받은 적이 없으므로 스냅샷부터 시작해야 하기 때문이다 (15장).
 */
@Component
public class PresenceService {

    private static final Pattern SCREEN = Pattern.compile("^/topic/cobrowse/([^/]+)/screen$");
    private static final Pattern COMMANDS = Pattern.compile("^/topic/cobrowse/([^/]+)/commands$");

    private final PresenceStore store;
    private final MessageRelay relay;
    private final ObjectMapper json;
    private final String nodeId;
    private final Duration ttl;

    /** 이 노드에 붙은 연결들의 presence (TTL 갱신 대상). key = sessionId|subscriptionId */
    private final Map<String, PresenceEntry> local = new ConcurrentHashMap<>();

    public PresenceService(PresenceStore store, MessageRelay relay, ObjectMapper json,
                           @Value("${chat.node-id}") String nodeId,
                           @Value("${chat.presence.ttl}") Duration ttl) {
        this.store = store;
        this.relay = relay;
        this.json = json;
        this.nodeId = nodeId;
        this.ttl = ttl;
    }

    @EventListener
    public void onSubscribe(SessionSubscribeEvent event) {
        StompHeaderAccessor h = StompHeaderAccessor.wrap(event.getMessage());
        if (!(h.getUser() instanceof ChatPrincipal user)) return;
        String dest = String.valueOf(h.getDestination());

        String roomId;
        String channel;
        Matcher m;
        if ((m = SCREEN.matcher(dest)).matches()) {
            roomId = m.group(1);
            channel = "screen";
        } else if ((m = COMMANDS.matcher(dest)).matches()) {
            roomId = m.group(1);
            channel = "commands";
        } else {
            return;
        }
        String key = h.getSessionId() + "|" + h.getSubscriptionId();
        PresenceEntry entry = new PresenceEntry(roomId, user.userId(), user.role().name(), channel, nodeId);
        local.put(key, entry);
        store.put(key, entry, ttl);
        broadcastStatus(roomId);

        if ("screen".equals(channel)) {
            send("/topic/cobrowse/" + roomId + "/commands",
                    Map.of("type", "resync", "reason", "viewer-joined", "by", user.userId()));
        }
    }

    @EventListener
    public void onUnsubscribe(SessionUnsubscribeEvent event) {
        StompHeaderAccessor h = StompHeaderAccessor.wrap(event.getMessage());
        drop(h.getSessionId() + "|" + h.getSubscriptionId());
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        String prefix = event.getSessionId() + "|";
        local.keySet().stream().filter(k -> k.startsWith(prefix)).toList().forEach(this::drop);
    }

    private void drop(String key) {
        PresenceEntry e = local.remove(key);
        if (e == null) return;
        store.remove(key);
        broadcastStatus(e.getRoomId());
    }

    /** TTL 이 지나 사라지지 않도록, 살아 있는 동안 주기적으로 갱신한다. */
    @Scheduled(fixedDelayString = "${chat.presence.refresh-interval}")
    public void refresh() {
        local.forEach((key, entry) -> store.put(key, entry, ttl));
    }

    public Map<String, Object> status(String roomId) {
        List<PresenceEntry> all = store.inRoom(roomId);
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("type", "presence");
        s.put("roomId", roomId);
        s.put("customerSharing", all.stream().anyMatch(e -> "commands".equals(e.getChannel())));
        s.put("agentsViewing", all.stream().filter(e -> "screen".equals(e.getChannel()))
                .map(PresenceEntry::getUserId).distinct().sorted().toList());
        s.put("nodes", all.stream().map(PresenceEntry::getNodeId).distinct().sorted().toList());
        return s;
    }

    private void broadcastStatus(String roomId) {
        send("/topic/rooms/" + roomId + "/status", status(roomId));
    }

    private void send(String destination, Map<String, ?> body) {
        try {
            relay.publish(destination, json.writeValueAsBytes(body));
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }
}
