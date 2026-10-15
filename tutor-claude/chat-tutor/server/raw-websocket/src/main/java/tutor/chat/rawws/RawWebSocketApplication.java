package tutor.chat.rawws;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/** 07장: HTTP 로 시작해 WebSocket 으로 "갈아타는" 과정을 직접 본다. */
@SpringBootApplication
@EnableScheduling // KeepAliveTask 의 @Scheduled 를 켠다
public class RawWebSocketApplication {
    public static void main(String[] args) {
        SpringApplication.run(RawWebSocketApplication.class, args);
    }
}
