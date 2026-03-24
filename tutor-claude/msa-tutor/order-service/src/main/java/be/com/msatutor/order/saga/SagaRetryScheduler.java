package be.com.msatutor.order.saga;

import java.time.Instant;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class SagaRetryScheduler {

    private final OrderSagaRepository sagaRepository;
    private final SagaOrchestrator sagaOrchestrator;

    public SagaRetryScheduler(OrderSagaRepository sagaRepository, SagaOrchestrator sagaOrchestrator) {
        this.sagaRepository = sagaRepository;
        this.sagaOrchestrator = sagaOrchestrator;
    }

    @Scheduled(fixedDelayString = "${saga.retry-scan-ms:5000}")
    @Transactional
    public void retryTimedOutSteps() {
        // This scan simulates a production "saga timer" or workflow engine timer.
        // The scan is coarse on purpose; the retry backoff prevents hot loops.
        List<OrderSaga> candidates = sagaRepository.findByStatusInAndNextRetryAtBefore(
            List.of(SagaStatus.IN_PROGRESS, SagaStatus.COMPENSATING),
            Instant.now()
        );

        for (OrderSaga saga : candidates) {
            sagaOrchestrator.retrySaga(saga);
        }
    }
}
