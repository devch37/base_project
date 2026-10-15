package tutor.chat.secure;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 10~12장: 누가(인증) 무엇을 할 수 있는가(인가)를 STOMP 위에서 지킨다.
 *
 * <pre>
 * [고객사 백엔드] --X-Api-Key--> POST /internal/rooms, /internal/tokens  (서버 ↔ 서버)
 *        │ JWT 를 자기 사용자(브라우저)에게 전달
 *        ▼
 * [브라우저] --STOMP CONNECT (Authorization: Bearer JWT)--> [이 서버]
 *            --SUBSCRIBE /topic/rooms/{id}-->  방/역할 권한 검사
 *            --SEND /app/rooms/{id}/send-->    방/역할 권한 + 토큰 만료 검사
 * </pre>
 */
@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class SecureChatApplication {
    public static void main(String[] args) {
        SpringApplication.run(SecureChatApplication.class, args);
    }
}
