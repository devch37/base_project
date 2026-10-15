package tutor.chat.cobrowse.relay;

import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Component;
import org.springframework.util.MimeTypeUtils;

/**
 * 이 서버의 simple broker 로 "이미 JSON 인 바이트"를 그대로 보낸다.
 *
 * <p>convertAndSend(dest, String) 을 쓰면 변환기가 끼어들어 content-type 이 text/plain 이 되거나,
 * JSON 변환기가 문자열을 한 번 더 따옴표로 감싸는 사고가 난다. 중계 서버는 내용을 건드리지 않는 게 원칙.
 */
@Component
public class LocalBroker {

    private final SimpMessagingTemplate template;

    public LocalBroker(SimpMessagingTemplate template) {
        this.template = template;
    }

    public void send(String destination, byte[] json) {
        SimpMessageHeaderAccessor h = SimpMessageHeaderAccessor.create(SimpMessageType.MESSAGE);
        h.setDestination(destination);
        h.setContentType(MimeTypeUtils.APPLICATION_JSON);
        h.setLeaveMutable(true);
        template.send(destination, MessageBuilder.createMessage(json, h.getMessageHeaders()));
    }
}
