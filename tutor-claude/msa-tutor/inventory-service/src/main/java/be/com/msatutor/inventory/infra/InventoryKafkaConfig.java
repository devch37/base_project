package be.com.msatutor.inventory.infra;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(InventoryTopicsProperties.class)
public class InventoryKafkaConfig {
}
