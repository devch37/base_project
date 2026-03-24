package be.com.msatutor.order.infra;

import be.com.msatutor.order.saga.SagaOrchestrator;
import java.util.Map;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class PaymentResultConsumer {

    private final SagaOrchestrator sagaOrchestrator;

    public PaymentResultConsumer(SagaOrchestrator sagaOrchestrator) {
        this.sagaOrchestrator = sagaOrchestrator;
    }

    @KafkaListener(topics = "#{orderTopicsProperties.paymentApproved()}", groupId = "order-service")
    public void onPaymentApproved(Map<String, Object> event) {
        sagaOrchestrator.onPaymentApproved(
            EventExtractor.eventId(event),
            EventExtractor.orderId(event),
            EventExtractor.correlationId(event)
        );
    }

    @KafkaListener(topics = "#{orderTopicsProperties.paymentFailed()}", groupId = "order-service")
    public void onPaymentFailed(Map<String, Object> event) {
        sagaOrchestrator.onPaymentFailed(
            EventExtractor.eventId(event),
            EventExtractor.orderId(event),
            EventExtractor.correlationId(event),
            EventExtractor.errorReason(event, "PAYMENT_FAILED")
        );
    }
}
