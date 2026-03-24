package be.com.msatutor.order.saga;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SagaInboxRepository extends JpaRepository<SagaInbox, String> {
}
