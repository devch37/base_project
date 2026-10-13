package tutor.stomp.step3_hazelcast;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import tutor.stomp.step2_stomp.ChatMessage;

/**
 * 서버 1대용: 이 서버의 브로커로 바로 보낸다.
 * SimpMessagingTemplate = 컨트롤러 return(@SendTo) 없이도 코드에서 "/topic/..." 으로 보낼 수 있게 해 주는 도구.
 */
public class LocalChatBroadcaster implements ChatBroadcaster {

    private final SimpMessagingTemplate template;

    public LocalChatBroadcaster(SimpMessagingTemplate template) {
        this.template = template;
    }

    @Override
    public void send(ChatMessage message) {
        template.convertAndSend("/topic/rooms/" + message.roomId(), message);
    }
}
