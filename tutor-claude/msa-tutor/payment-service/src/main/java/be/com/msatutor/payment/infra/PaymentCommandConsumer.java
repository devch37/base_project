package be.com.msatutor.payment.infra;

import be.com.msatutor.payment.domain.PaymentProcessor;
import java.math.BigDecimal;
import java.util.Map;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class PaymentCommandConsumer {

    private final PaymentProcessor paymentProcessor;

    public PaymentCommandConsumer(PaymentProcessor paymentProcessor) {
        this.paymentProcessor = paymentProcessor;
    }

    @KafkaListener(topics = "#{paymentTopicsProperties.paymentAuthorizeCommand()}", groupId = "payment-service")
    public void onPaymentAuthorize(Map<String, Object> event) {
        Object payload = event.get("payload");
        if (payload instanceof Map<?, ?> payloadMap) {
            String orderId = String.valueOf(payloadMap.get("orderId"));
            BigDecimal amount = new BigDecimal(String.valueOf(payloadMap.get("amount")));

            String correlationId = "";
            Object metadata = event.get("metadata");
            if (metadata instanceof Map<?, ?> metadataMap) {
                correlationId = String.valueOf(metadataMap.getOrDefault("correlationId", ""));
            }

            // Command handler = local transaction only.
            // We don't do any remote calls here; we emit a result event instead.
            // Simulate a real gateway decision rule for learning:
            // amounts up to 1000 are approved, otherwise rejected.
            if (amount.compareTo(new BigDecimal("1000")) <= 0) {
                paymentProcessor.approve(orderId, correlationId);
            } else {
                paymentProcessor.reject(orderId, correlationId, "AMOUNT_TOO_HIGH");
            }
            return;
        }
        throw new IllegalArgumentException("Invalid payment command payload");
    }
}
