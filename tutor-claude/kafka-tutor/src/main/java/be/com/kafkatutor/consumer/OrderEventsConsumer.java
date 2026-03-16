package be.com.kafkatutor.consumer;

import java.util.Map;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

@Component
public class OrderEventsConsumer {

    @KafkaListener(topics = "#{topicProperties.orderEvents()}", groupId = "order-events-consumer")
    public void handle(ConsumerRecord<String, Object> record, Acknowledgment acknowledgment) {
        // Manual ack gives us control to retry or send to DLT via error handler.
        Object value = record.value();
        if (value instanceof Map<?, ?> map) {
            Object payload = map.get("payload");
            if (payload instanceof Map<?, ?> payloadMap && payloadMap.containsKey("fail")) {
                throw new IllegalStateException("Forced failure to demonstrate DLT");
            }
        }

        System.out.printf("[OrderEvent] key=%s value=%s%n", record.key(), record.value());
        acknowledgment.acknowledge();
    }
}
