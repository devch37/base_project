package be.com.msatutor.payment.infra;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "msa.topics")
public record PaymentTopicsProperties(
    String orderCreated,
    String orderCancelled,
    String paymentApproved,
    String paymentFailed
) {
}
