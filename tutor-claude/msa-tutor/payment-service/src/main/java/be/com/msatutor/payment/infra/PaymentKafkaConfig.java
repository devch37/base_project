package be.com.msatutor.payment.infra;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(PaymentTopicsProperties.class)
public class PaymentKafkaConfig {
}
