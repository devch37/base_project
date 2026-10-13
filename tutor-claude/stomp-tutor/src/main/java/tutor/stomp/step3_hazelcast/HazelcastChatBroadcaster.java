package tutor.stomp.step3_hazelcast;

import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.topic.ITopic;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import tutor.stomp.step2_stomp.ChatMessage;

/**
 * 서버 N대용: Hazelcast Topic(Pub/Sub)으로 모든 서버에 방송한다.
 *
 * <pre>
 *  철수(8081 에 접속) ─SEND─▶ 서버8081.send()
 *                                 │ topic.publish(message)
 *                                 ▼
 *                     [ Hazelcast Topic "chat" ]
 *                        │                  │
 *                        ▼                  ▼
 *               서버8081 리스너          서버8082 리스너
 *               → 8081 브로커          → 8082 브로커
 *               → 8081 에 붙은 구독자    → 8082 에 붙은 영희
 * </pre>
 *
 * 왜 필요한가? STOMP 브로커(enableSimpleBroker)는 "자기 서버의 구독자"만 안다.
 * 영희가 8082 에 붙어 있으면 8081 의 브로커는 영희의 존재를 모른다.
 *
 * 주의: 보낸 서버(8081) 자신도 Topic 메시지를 받는다. 그래서 send() 에서 로컬로 "따로" 보내지 않는다.
 *       따로 보내면 8081 에 붙은 사람은 같은 메시지를 두 번 받는다.
 */
public class HazelcastChatBroadcaster implements ChatBroadcaster {

    private final ITopic<ChatMessage> topic;

    public HazelcastChatBroadcaster(HazelcastInstance hazelcast, SimpMessagingTemplate template) {
        this.topic = hazelcast.getTopic("chat");
        // 모든 서버가 같은 Topic 을 구독 → 누가 publish 하든 모든 서버에서 이 리스너가 실행된다
        topic.addMessageListener(event -> {
            ChatMessage m = event.getMessageObject();
            template.convertAndSend("/topic/rooms/" + m.roomId(), m); // 받은 서버가 "자기" 구독자에게 전달
        });
    }

    @Override
    public void send(ChatMessage message) {
        topic.publish(message);
    }
}
