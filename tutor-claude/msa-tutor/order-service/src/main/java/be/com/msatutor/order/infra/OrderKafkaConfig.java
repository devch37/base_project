package be.com.msatutor.order.infra;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(OrderTopicsProperties.class)
public class OrderKafkaConfig {
}
