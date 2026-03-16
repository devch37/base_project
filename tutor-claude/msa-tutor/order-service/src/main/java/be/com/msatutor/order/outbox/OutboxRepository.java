package be.com.msatutor.order.outbox;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OutboxRepository extends JpaRepository<OutboxEvent, String> {
    List<OutboxEvent> findTop200ByStatusOrderByCreatedAt(OutboxStatus status);
}
