# 23. 다중 서버 — 로드밸런싱 · 클러스터 · Hazelcast Topic vs IMap · 로컬 메모리 vs 공유 상태 · heartbeat vs TTL

## 이 장의 목표
- 서버를 2대로 늘리면 **무엇이 깨지는지** 이 프로젝트의 코드로 짚을 수 있다.
- **서로 다른 서버에 붙은 고객과 상담사** 사이에 메시지가 오가게 하는 구조를 설명할 수 있다.
- Hazelcast **Topic(흘려보내는 메시지)** 과 **IMap(저장되는 상태)** 를 구분해 쓸 수 있다.
- **heartbeat 와 TTL 의 차이**를 "누가 정리하나"의 관점에서 설명할 수 있다.

## 프로젝트에서 이 장의 자리
`chat.cluster.enabled=true` 하나로 서버 1대 ↔ N대 모드가 바뀐다 (`StoreConfig`). 컨트롤러·인터셉터·presence 코드는 한 줄도 다르지 않다 — 05장의 "인터페이스 + Bean 교체"의 결실.

---

## 1. 로드밸런싱과 클러스터

```
                    ┌──────────────┐
 브라우저들 ──wss──▶ │ 로드밸런서     │ ──▶ 서버 A (8081)
                    │ (nginx, ALB)  │ ──▶ 서버 B (8082)
                    └──────────────┘
```
- **로드밸런서**: 요청·연결을 여러 서버에 나눈다 (라운드로빈, 최소 연결 …). 헬스체크(`/actuator/health`)로 죽은 서버를 뺀다.
- WebSocket 은 **연결 단위**로 나뉜다. 한번 A 에 붙은 연결은 끊길 때까지 A 다.
- **클러스터**: 서버들이 서로를 알고 정보를 공유하는 묶음. 여기서는 Hazelcast 가 그 역할 (각 Spring 앱 안에 Hazelcast 멤버가 임베드).

## 2. 서버를 늘리면 깨지는 것들 (서버 로컬 메모리)

| 이 프로젝트의 로컬 상태 | 서버 2대에서 생기는 문제 |
|---|---|
| simple broker 의 구독자 목록 | 고객이 A, 상담사가 B → **A 에서 보낸 화면이 B 의 상담사에게 안 간다** |
| `RoomStore` (방·배정·동의) | A 에서 만든 방을 B 가 모른다 → B 에 붙은 상담사는 "권한 없음" |
| presence | 각 서버가 자기 쪽 절반만 안다 |
| `SessionRegistry` (소켓) | 강제 퇴장 API 가 A 로 가면 B 의 연결을 못 닫는다 |
| 쿠키 세션 (10장) | A 에서 로그인, B 는 모름 |

해결 두 가지:
- **sticky session**: 같은 사용자를 항상 같은 서버로 (`ip_hash` 등). 하지만 고객과 상담사는 **다른 사용자**라 같은 서버로 보낼 수 없다 → 이 프로젝트에는 부족.
- **공유**: 메시지는 서버 간에 방송, 상태는 공유 저장소. ← 우리 선택

## 3. Hazelcast Topic vs IMap

| | **ITopic** (Pub/Sub) | **IMap** (분산 Map) |
|---|---|---|
| 성격 | 흘려보내는 **메시지** | 저장되는 **상태** |
| 늦게 온 노드 | 지난 메시지 못 받음 | 언제든 조회 |
| 이 프로젝트 | 화면·명령·채팅·상태 **중계**, 강제 퇴장 **제어 명령** | 방 정보(`rooms`), presence(`presence`, TTL) |
| 장애 시 | 최대 1회 전달 — 유실 가능 (19장 재동기화가 메움) | 기본 백업 1개 → 한 노드가 죽어도 데이터 유지 |

### 메시지 중계 (`HazelcastMessageRelay`)
```
고객 ─▶ 서버A: relay.publish("/topic/cobrowse/r1/screen", bytes)
                 └▶ Hazelcast Topic "cobrowse-relay" ─┬▶ 서버A 리스너 ─▶ A 의 로컬 브로커 ─▶ (A 의 구독자)
                                                     └▶ 서버B 리스너 ─▶ B 의 로컬 브로커 ─▶ 상담사
```
**보낸 서버 자신도 Topic 메시지를 받는다** → publish 에서 로컬로 "따로" 보내면 A 의 구독자는 **두 번** 받는다(흔한 버그).
`ClusterTest` 가 "같은 프레임이 두 번 오지 않음"을 확인한다.

### 공유 상태 (`RoomStore` + IMap)
`RoomStore` 는 생성자로 `ConcurrentMap` 을 받는다. 로컬이면 `ConcurrentHashMap`, 클러스터면 `hz.getMap("rooms")` — **IMap 은 ConcurrentMap 이다**. 코드 변경 0.
수정은 항상 `computeIfPresent` → 두 서버가 동시에 배정해도 한쪽 변경이 사라지지 않는다(lost update 방지).
값(`RoomInfo`)은 **불변 record + Serializable** — 다른 서버로 직렬화돼 넘어가고, 부분 수정 대신 통째로 교체한다.

### ★ 소켓은 절대 공유 상태가 될 수 없다
소켓은 특정 서버 프로세스의 OS 자원이다. 그래서 강제 퇴장은 "**모든 노드에 명령을 방송** → 각 노드가 자기 로컬 연결 중 해당자를 닫는다" (`publishControl` → `ControlHandler`).

## 4. heartbeat vs TTL

| | heartbeat (07·09장) | TTL (이 장) |
|---|---|---|
| 대상 | **연결** 하나 | **저장된 데이터** 한 줄 |
| 누가 확인 | 연결의 양 끝 | 저장소(Hazelcast)가 시간이 지나면 자동 삭제 |
| 정리하는 주체 | 그 연결을 가진 **서버** | **저장소 자체** |
| 대비하는 상황 | 상대가 조용히 사라짐 | **정리해 줄 서버 자체가 죽음** |

서버 A 의 전원이 나가면? A 의 연결들은 heartbeat 로 정리될 기회조차 없다 — 정리 코드가 A 에서 돌기 때문이다.
공유 저장소에 A 가 써 둔 presence("상담사 agent-1 이 보고 있음")는 영원히 남는다 → **TTL**(기본 30초)을 걸고,
살아 있는 동안 A 가 주기적으로 **갱신**(10초)한다. A 가 죽으면 갱신이 멈추고 30초 뒤 사라진다 (`PresenceService.refresh`, `HazelcastPresenceStore`).
`ClusterTest` 와 `web/e2e/cluster.e2e.ts`("A 의 presence 는 TTL 로 사라진다")가 확인한다.

## 5. Hazelcast 설정 (`StoreConfig.Cluster`)
- `clusterName`: 이름이 같은 멤버끼리만 합쳐진다 (개발·운영이 섞이지 않게; 테스트는 매번 다른 이름)
- `tcp-ip` members 명시, multicast 끔 (클라우드·사내망은 멀티캐스트가 막혀 있는 경우가 많다; k8s 는 discovery 플러그인 ⏭)
- `hazelcast.max.no.heartbeat.seconds=10`: 멤버가 죽었다고 판단하는 시간 (기본 60초는 실습에 길다)
- Hazelcast 멤버 포트(5701~)는 HTTP 포트와 **별개**다.
- ⏭ 고급: split-brain(네트워크가 갈라져 클러스터가 둘로), CP Subsystem(강한 일관성), ReliableTopic, 클라이언트-서버 구조

---

## 코드 읽기 (`server/cobrowse-server/src/main/java/tutor/chat/cobrowse/`)
1. `config/StoreConfig` — Local / Cluster 두 묶음의 Bean
2. `relay/MessageRelay`, `LocalMessageRelay`, `HazelcastMessageRelay`, `LocalBroker`, `ControlHandler`
3. `room/RoomStore`, `RoomInfo`
4. `presence/PresenceStore`, `LocalPresenceStore`(TTL 흉내), `HazelcastPresenceStore`, `PresenceService`(갱신 스케줄)
5. `auth/SessionRegistry` — 왜 로컬인가
6. `web/PublicApiController` — `/api/public/node` (지금 어느 노드, 클러스터 멤버 수)
7. 테스트 `ClusterTest`(한 JVM 에 노드 2개), `web/e2e/cluster.e2e.ts`(진짜 프로세스 2개 + 브라우저)

## 직접 해 보기 — 서버 2대 띄우기
```bash
./gradlew :server:cobrowse-server:bootJar -q
JAR=server/cobrowse-server/build/libs/cobrowse-server.jar
SERVER_PORT=8081 CHAT_CLUSTER_ENABLED=true CHAT_CLUSTER_PORT=5701 java -jar $JAR     # 터미널 1
SERVER_PORT=8082 CHAT_CLUSTER_ENABLED=true CHAT_CLUSTER_PORT=5702 java -jar $JAR     # 터미널 2
curl -s localhost:8082/api/public/node        # clusterMembers: 2 가 될 때까지 기다리기
CHAT_SERVERS=http://localhost:8081,http://localhost:8082 npm run tenant              # 터미널 3
CHAT_SERVER=http://localhost:8081 npm run dev                                         # 터미널 4
```
- 고객: `http://localhost:5173/apps/customer/?ws=ws://localhost:8081/ws,ws://localhost:8082/ws`
- 상담사: `http://localhost:5173/apps/agent/?ws=ws://localhost:8082/ws`
1. 고객은 8081, 상담사는 8082 에 붙었는데 화면·채팅·원격 조작이 되는가? 상담사 로그의 presence `서버 [node-8081,node-8082]`.
2. 로드밸런서 흉내: `npm run lab:21:proxy -- --targets=8081,8082` 후 고객·상담사 모두 `?ws=ws://localhost:8888/ws` → 라운드로빈으로 서로 다른 서버에 붙어도 동작.
3. (비교) 두 서버를 `CHAT_CLUSTER_ENABLED=false` 로 띄우면? 상담사 입장부터 실패한다 — 방을 모른다.

## 자주 하는 실수
- 서버를 늘리면서 simple broker·로컬 Map 을 그대로 둠
- Topic 발행 + 로컬 직접 전송 → 중복
- 공유 상태를 get → 수정 → put (lost update)
- presence 를 공유 저장소에 쓰면서 TTL 없음 → 서버 장애 후 "유령"
- 클러스터 이름 공유 → 동료의 개발 서버와 내 서버가 한 클러스터로 합쳐짐

## 확인 질문
1. 고객 A·상담사 B 상황에서 고객의 화면 프레임이 상담사에게 가는 경로를 클래스 이름으로.
2. IMap 에 presence 를 두는데 왜 heartbeat 만으로 부족한가?
3. sticky session 으로 이 문제를 풀 수 없는 이유는?

<details><summary>답</summary>

1. `CobrowseController.frame` → `HazelcastMessageRelay.publish` → Topic → (B) 리스너 → `LocalBroker.send` → B 의 simple broker → 상담사 세션.
2. heartbeat 는 연결을 가진 서버가 정리하는 장치다. 그 서버가 죽으면 정리 코드도 안 돈다. 저장소가 스스로 지우는 TTL 이 필요하다.
3. 고객과 상담사는 서로 다른 사용자(다른 IP·세션)라 같은 서버로 보장되지 않는다.
</details>

다음 → [24. 장애 후 재연결과 캡스톤](../24-failover-capstone/)
