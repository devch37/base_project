package tutor.chat.cobrowse.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 22장: CORS 는 "브라우저가 다른 Origin 의 HTTP 응답을 JS 에 보여 줘도 되나"를 서버가 알려 주는 규칙.
 *
 * <p>WebSocket 은 CORS 의 적용을 받지 않는다! 브라우저는 다른 Origin 으로도 WebSocket 을 그냥 연다.
 * 그래서 WebSocket 은 StompConfig 의 setAllowedOriginPatterns 로 서버가 Origin 헤더를 직접 검사한다.
 * <ul>
 *   <li>CORS: 원래는 "브라우저가" 집행하는 규칙이다. 서버는 허용 헤더(Access-Control-Allow-Origin)를 붙일지만 정하고,
 *       헤더가 없으면 브라우저가 JS 에게 응답을 보여 주지 않는다. Spring 은 한 걸음 더 나가 허용되지 않은 Origin 의
 *       CORS 요청을 서버에서 403 "Invalid CORS request" 로 거절한다 (실측, 22장 README).</li>
 *   <li>WS Origin 검사: 서버가 핸드셰이크를 403 으로 거절한다. Origin 헤더가 아예 없으면(curl·Node) 통과한다.</li>
 * </ul>
 * 공통 한계: 둘 다 "브라우저가 보내는 Origin 헤더"에 기대므로, 브라우저가 아닌 클라이언트는 막지 못한다 → 인증이 따로 필요.
 * /internal/** 은 서버 간 호출 전용이라 CORS 를 열지 않는다 (브라우저에서 부를 일이 없어야 정상).
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private final String[] allowedOrigins;

    public CorsConfig(@Value("${chat.allowed-origins}") String[] allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/public/**").allowedOriginPatterns(allowedOrigins).allowedMethods("GET");
    }
}
