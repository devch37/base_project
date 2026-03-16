package be.com.kafkatutor.consumer;

import be.com.kafkatutor.config.TopicProperties;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class OrderCreatedConsumer {

    @KafkaListener(topics = "#{topicProperties.orderCreated()}", groupId = "order-created-consumer")
    public void handle(ConsumerRecord<String, Object> record) {
        // Basic MQ-style consumption: one message -> one handler.
        System.out.printf("[OrderCreated] key=%s value=%s%n", record.key(), record.value());
    }
}
