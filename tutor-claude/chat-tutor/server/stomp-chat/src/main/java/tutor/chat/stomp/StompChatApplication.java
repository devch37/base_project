package tutor.chat.stomp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/** 08~09장: STOMP 로 방 채팅 + 입장/퇴장 + heartbeat. */
@SpringBootApplication
public class StompChatApplication {
    public static void main(String[] args) {
        SpringApplication.run(StompChatApplication.class, args);
    }
}
