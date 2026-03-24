package be.com.msatutor.order.saga;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderSagaRepository extends JpaRepository<OrderSaga, String> {

    Optional<OrderSaga> findByOrderId(Long orderId);

    List<OrderSaga> findByStatusInAndNextRetryAtBefore(List<SagaStatus> statuses, Instant now);
}
