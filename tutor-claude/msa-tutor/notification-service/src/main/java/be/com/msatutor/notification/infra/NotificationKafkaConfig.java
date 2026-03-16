package be.com.msatutor.notification.infra;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(NotificationTopicsProperties.class)
public class NotificationKafkaConfig {
}
