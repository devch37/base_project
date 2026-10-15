# 05. Spring 서버 구조 — Controller · DTO · DI · Bean · Configuration · 인터페이스 · 고객사 정책 교체

## 이 장의 목표
- 요청 하나가 Spring 안에서 **Controller → Service → Repository** 로 흐르는 길을 따라갈 수 있다.
- DI(의존성 주입)와 Bean 이 "왜" 있는지, 직접 `new` 하면 무엇이 곤란한지 설명할 수 있다.
- **고객사마다 다른 정책을 인터페이스 + Bean 교체로** 처리하는 구조를 만들 수 있다.

## 프로젝트에서 이 장의 자리
최종 서버의 거의 모든 부품이 "인터페이스 + 갈아 끼우는 Bean" 이다.

| 인터페이스 | 구현 A | 구현 B | 무엇으로 고르나 |
|---|---|---|---|
| `ConsultPolicy` (이 장) | 24시간 | 영업시간만 | `chat.tenant` |
| `RoomAccessPolicy` (12·17장) | 기본 규칙 | 고객사 전용 규칙 | Bean 교체 |
| `MessageRelay` (23장) | 로컬 브로커 | Hazelcast Topic | `chat.cluster.enabled` |
| `PresenceStore` (23장) | 로컬 Map | Hazelcast IMap | `chat.cluster.enabled` |

이 장에서 패턴을 익히면 23장의 "설정 하나로 서버 1대 ↔ N대 전환"이 자연스럽게 읽힌다.

---

## 1. 요청이 흘러가는 길

```
HTTP 요청 ──▶ DispatcherServlet ──▶ RoomController ──▶ RoomService ──▶ RoomRepository(인터페이스)
                (Spring 이 제공)       (HTTP↔DTO)        (업무 판단)       └ InMemoryRoomRepository
                                         │                  ├ ConsultPolicy(인터페이스) ← 고객사별
                                         │                  ├ CrmClient (06장)
                                         ▼                  └ Clock (현재 시각)
                                   GlobalExceptionHandler (예외 → 상태 코드)
```

- **Controller**: HTTP 요청을 DTO 로 받고, DTO 를 응답으로 돌려준다. 판단은 하지 않는다(얇게).
- **Service**: 업무 규칙. "정책을 확인하고, CRM 에서 이름을 가져오고, 저장한다."
- **Repository**: 저장소. 메모리인지 DB 인지 Service 는 모른다.

## 2. DTO — 밖과 주고받는 모양

`CreateRoomRequest`(요청), `RoomResponse`(응답), `Room`(도메인)을 **일부러 분리**했다.
- `Room` 에는 `internalMemo` 같은 내부 정보가 있다. 도메인을 그대로 응답하면 **실수로 노출**된다 (`RoomApiTest` 가 확인).
- API 응답 모양을 바꿔도 도메인 로직은 안 바뀐다.
- `@Valid` + `@NotBlank` 로 **서버에서 다시 검증**한다. 브라우저 검증은 UX 용이고 서버 검증은 안전용이다.

## 3. DI · Bean — "직접 new 하지 않기"

```java
@Service
public class RoomService {
    public RoomService(RoomRepository repository, ConsultPolicy policy, CrmClient crmClient, Clock clock) { ... }
}
```
- **Bean**: Spring 컨테이너가 만들어서 관리하는 객체. `@Component`/`@Service`/`@Repository`/`@Controller` 를 붙이거나, `@Configuration` 클래스의 `@Bean` 메서드가 돌려주면 Bean 이 된다.
- **DI**: RoomService 는 필요한 것을 생성자로 "받기만" 한다. 누가 넣나? 컨테이너가 **타입이 맞는 Bean** 을 찾아서.
- 얻는 것:
  1. **교체 가능**: 고객사마다 다른 `ConsultPolicy` 를 넣을 수 있다.
  2. **테스트 가능**: 테스트에서 `CrmClient` 를 가짜(`@MockitoBean`)로, `Clock` 을 "토요일 오후 3시"로 바꿔 넣는다 (`TenantPolicyTest`).

## 4. @Component vs @Configuration + @Bean

| | `@Component` 류 | `@Configuration` + `@Bean` |
|---|---|---|
| 누가 등록 여부를 정하나 | 클래스 자신 | 설정 클래스 |
| 언제 쓰나 | 항상 하나만 있는 것 (`RoomService`) | **조건에 따라 고르는 것**, 남이 만든 클래스(외부 라이브러리) |
| 예 | `InMemoryRoomRepository` | `PolicyConfig.acmeBankConsultPolicy()`, `Clock` |

## 5. 고객사 정책을 인터페이스와 Bean 으로 교체하는 이유

나쁜 예:
```java
if (tenant.equals("acme-bank")) { /* 영업시간 검사 */ }
else if (tenant.equals("shop")) { ... }      // 고객사가 늘 때마다 핵심 코드 수정, A 수정이 B 를 깨뜨림
```
좋은 예 (`server/spring-basics/.../policy/`):
```java
public interface ConsultPolicy { PolicyDecision allowOpen(String customerId, Instant now); }

@Bean @ConditionalOnProperty(name = "chat.tenant", havingValue = "acme-bank")
ConsultPolicy acmeBankConsultPolicy() { return new BusinessHoursConsultPolicy(); }
```
- 핵심 코드(RoomService)는 **한 줄도 안 바뀐다.** 새 고객사 = 새 구현 클래스 + 조건부 Bean.
- 실무 확장: 고객사 전용 코드를 **별도 jar** 로 빼고, 그 jar 가 자기 Bean 을 등록. 우리 기본 Bean 은 `@ConditionalOnMissingBean` 으로 "없을 때만". (자동 설정(AutoConfiguration)에서만 순서가 보장된다는 점 주의 — `PolicyConfig` 주석)

## 6. ★ 검증과 예외 → 상태 코드

`GlobalExceptionHandler`(`@RestControllerAdvice`)가 예외를 한곳에서 상태 코드로 바꾼다.
응답 본문은 표준 형식 **ProblemDetail**(RFC 9457) — SDK 가 오류를 늘 같은 모양으로 받는다.
`PolicyViolationException` 을 403 이 아니라 **422** 로 둔 이유(영업시간 외는 "권한" 문제가 아니다)를 주석에서 읽어 보자.

## 7. ★ 시간(Clock)도 주입한다

`BusinessHoursConsultPolicy` 는 `Instant`(절대 시각)를 받고 시간대를 스스로 정한다.
`LocalDateTime.now()` 를 쓰면 **서버가 UTC 로 돌 때** 영업시간 판단이 9시간 어긋난다 — 실무에서 정말 자주 나는 버그.

---

## 코드 읽기 (`server/spring-basics/src/main/java/tutor/chat/basics/`)
1. `SpringBasicsApplication` — @SpringBootApplication 이 하는 세 가지
2. `room/RoomController` → `room/RoomService` → `room/RoomRepository` / `InMemoryRoomRepository`
3. `room/CreateRoomRequest`, `RoomResponse`, `Room` — DTO 분리
4. `policy/ConsultPolicy`, `DefaultConsultPolicy`, `BusinessHoursConsultPolicy`, `PolicyConfig`
5. `common/GlobalExceptionHandler`
6. 테스트: `RoomApiTest`(MockMvc), `TenantPolicyTest`(Bean 교체 + 고정 시계)

## 직접 해 보기
```bash
./gradlew :server:spring-basics:test
./gradlew :server:spring-basics:bootRun
curl -i -X POST localhost:8080/api/rooms -H 'Content-Type: application/json' -d '{"customerId":"c-1","topic":"카드 분실"}'
curl -s localhost:8080/api/rooms | python3 -m json.tool

# 정책 전환: 서버를 끄고
CHAT_TENANT=acme-bank ./gradlew :server:spring-basics:bootRun
# 지금이 평일 9~18시가 아니면 422 가 나온다
```
**도전 과제 (Java)**
1. 새 고객사 `shop` 정책을 만들어라: "고객 ID 가 `vip-` 로 시작하면 항상 허용, 아니면 평일만". `PolicyConfig` 에 조건부 Bean 추가 + 테스트.
2. `RoomRepository` 의 두 번째 구현 `LoggingRoomRepository`(저장할 때 로그를 남기고 InMemory 에 위임)를 만들고, 설정값으로 고르게 해 보라.
3. `RoomResponse` 에 `createdAt` 을 서울 시간 문자열로 바꿔 내보내려면 어디를 고쳐야 할까? 도메인은 건드리지 않고.

## 자주 하는 실수
- Controller 에 업무 로직을 넣는다 → STOMP 컨트롤러(08장)에서 같은 로직이 필요할 때 복붙하게 된다.
- 같은 타입 Bean 이 두 개 → "expected single matching bean but found 2" 기동 실패. 조건(@Conditional…)이나 `@Primary` 로 하나만.
- `@Component` 를 `@SpringBootApplication` 패키지 **밖**에 두어 스캔이 안 된다.

## 확인 질문
1. `RoomService` 가 `new BusinessHoursConsultPolicy()` 를 직접 하면 무엇을 잃나? (두 가지)
2. 생성자가 하나뿐인데 `@Autowired` 가 없다. 주입이 되나?
3. 영업시간 외 요청에 403 대신 422 를 쓴 이유는?

<details><summary>답</summary>

1. 고객사별 교체 가능성, 테스트에서 가짜로 바꾸기.
2. 된다. 생성자가 하나면 Spring 이 그 생성자로 주입한다.
3. 403 은 "이 사용자는 권한이 없다"(인가). 영업시간 외는 사용자의 권한 문제가 아니라 업무 규칙이다.
</details>

다음 → [06. 서버 간 HTTP 호출과 오류 처리](../06-server-to-server-http/)
