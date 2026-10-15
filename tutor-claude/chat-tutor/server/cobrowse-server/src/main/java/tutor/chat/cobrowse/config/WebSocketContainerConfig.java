package tutor.chat.cobrowse.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

/**
 * Tomcat(서블릿 컨테이너) 수준의 WebSocket 버퍼 크기.
 *
 * <p>함정(18장): Tomcat 의 텍스트 메시지 버퍼 기본값은 8KB 다. Spring STOMP 의 64KB 한도를 믿고
 * 20KB 메시지를 보내면, Spring 에 닿기도 전에 Tomcat 이 1009(Message Too Big)로 연결을 끊는다.
 * stomp-chat 모듈의 MessageSizeTest 가 이 현상을 실제로 보여 준다.
 */
@Configuration
public class WebSocketContainerConfig {

    @Bean
    public ServletServerContainerFactoryBean webSocketContainer(@Value("${chat.max-message-bytes}") int maxBytes) {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        container.setMaxTextMessageBufferSize(maxBytes);
        container.setMaxBinaryMessageBufferSize(maxBytes);
        return container;
    }
}
