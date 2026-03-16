package be.com.kafkatutor.consumer;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class DeadLetterConsumer {

    @KafkaListener(topics = "#{topicProperties.dlt()}", groupId = "dlt-consumer")
    public void handle(ConsumerRecord<String, Object> record) {
        System.out.printf("[DLT] key=%s value=%s%n", record.key(), record.value());
    }
}
