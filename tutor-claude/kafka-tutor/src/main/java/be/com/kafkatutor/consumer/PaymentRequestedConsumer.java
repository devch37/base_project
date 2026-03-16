package be.com.kafkatutor.consumer;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class PaymentRequestedConsumer {

    @KafkaListener(topics = "#{topicProperties.paymentRequested()}", groupId = "payment-consumer")
    public void handle(ConsumerRecord<String, Object> record) {
        System.out.printf("[PaymentRequested] key=%s value=%s%n", record.key(), record.value());
    }
}
