package tutor.chat.cobrowse;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 최종 프로젝트: 화면 동기화(co-browsing) 상담 서버.
 *
 * <pre>
 *  [고객 브라우저 + SDK]                         [상담사 콘솔]
 *     │ SEND /app/cobrowse/{room}/frame              ▲ /topic/cobrowse/{room}/screen
 *     │      (스냅샷·변경분·입력·스크롤, 조각)        │
 *     ▼                                              │
 *  ┌──────────────── cobrowse-server ─────────────────┐
 *  │ StompAuthInterceptor: JWT·방·역할·동의 검사       │
 *  │ CobrowseController : 내용은 해석하지 않고 중계     │
 *  │ MessageRelay       : 로컬 브로커 or Hazelcast Topic│
 *  │ RoomStore/Presence : 로컬 Map or Hazelcast IMap   │
 *  └──────────────────────────────────────────────────┘
 *     ▲                                              │
 *     │ /topic/cobrowse/{room}/commands              │ SEND /app/cobrowse/{room}/command
 *  [고객 SDK 가 클릭·입력 적용]  ◀──────────────────  (상담사의 클릭·입력)
 * </pre>
 *
 * 서버가 화면 내용을 "해석하지 않는" 이유: 압축·조각난 데이터를 풀어 볼 필요가 없고(성능),
 * 개인정보를 서버가 볼 일도 줄어든다. 마스킹은 반드시 고객 브라우저(SDK)에서 끝낸다 (22장).
 */
@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class CobrowseServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(CobrowseServerApplication.class, args);
    }
}
