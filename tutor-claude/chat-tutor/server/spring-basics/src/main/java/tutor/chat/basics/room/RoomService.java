package tutor.chat.basics.room;

import java.time.Clock;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import tutor.chat.basics.crm.CrmClient;
import tutor.chat.basics.policy.ConsultPolicy;
import tutor.chat.basics.policy.PolicyDecision;
import tutor.chat.basics.policy.PolicyViolationException;

/**
 * 비즈니스 로직 계층.
 *
 * <p><b>DI(의존성 주입)를 눈으로 보기</b><br>
 * 이 클래스는 RoomRepository, ConsultPolicy, CrmClient, Clock 을 직접 new 하지 않는다.
 * 생성자로 "받기만" 한다. 누가 넣어 주나? Spring 컨테이너가 Bean 들 중에서 타입이 맞는 것을 찾아 넣는다.
 *
 * <p>직접 new 하지 않아서 얻는 것:
 * <ul>
 *   <li>고객사마다 ConsultPolicy 구현을 바꿔 끼울 수 있다 (05장 핵심)</li>
 *   <li>테스트에서 Clock 을 "고정된 시각"으로 바꿔 넣을 수 있다</li>
 * </ul>
 * 생성자가 하나뿐이면 @Autowired 를 안 써도 Spring 이 이 생성자로 주입한다.
 */
@Service
public class RoomService {

    private final RoomRepository repository;
    private final ConsultPolicy policy;
    private final CrmClient crmClient;
    private final Clock clock;

    public RoomService(RoomRepository repository, ConsultPolicy policy, CrmClient crmClient, Clock clock) {
        this.repository = repository;
        this.policy = policy;
        this.crmClient = crmClient;
        this.clock = clock;
    }

    public Room open(CreateRoomRequest request) {
        // 1) 고객사 정책 검사 — 어떤 정책인지는 이 코드가 모른다(인터페이스).
        PolicyDecision decision = policy.allowOpen(request.customerId(), clock.instant());
        if (!decision.allowed()) {
            throw new PolicyViolationException(decision.reason());
        }

        // 2) 서버 간 HTTP 호출(06장). 실패해도 상담 자체는 열어야 한다 → CrmClient 가 대체값을 준다.
        String customerName = crmClient.findCustomerName(request.customerId());

        Room room = new Room(
                UUID.randomUUID().toString(),
                request.customerId(),
                customerName,
                request.topic(),
                clock.instant(),
                "tenant=" + policy.name());
        return repository.save(room);
    }

    public Room get(String roomId) {
        return repository.findById(roomId).orElseThrow(() -> new RoomNotFoundException(roomId));
    }

    public List<Room> list() {
        return repository.findAll();
    }
}
