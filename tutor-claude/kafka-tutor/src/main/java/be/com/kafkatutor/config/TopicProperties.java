package be.com.kafkatutor.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "kafka.topics")
public record TopicProperties(
    String orderCreated,
    String paymentRequested,
    String orderEvents,
    String orderEventsCounts,
    String dlt
) {
}
