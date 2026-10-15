# 뒤로 미룬 고급 주제

본문 24장을 끝낸 뒤에 보자. 각 항목은 "왜 미뤘나 / 어디서 시작하나"만 적었다.

## 메시징·브로커
- **외부 브로커 relay** (RabbitMQ/ActiveMQ 의 STOMP): `enableStompBrokerRelay`. Hazelcast Topic 대신 브로커가 서버 간 전달·구독 관리를 맡는다. 운영 부품이 하나 늘지만 구독 상태를 브로커가 들고 있다.
- **Redis Pub/Sub / Streams**: Hazelcast 대신 쓰는 흔한 선택. Pub/Sub 는 유실 가능, Streams 는 보관·재처리 가능.
- **Hazelcast ReliableTopic**: Ringbuffer 기반, 느린 리스너·일시 장애에 강하다.
- **백프레셔·전송률 제한**: 고객 SDK 가 초당 프레임 수를 제한하고, 서버는 방별·연결별 rate limit. 현재는 `setSendBufferSizeLimit` 로 느린 클라이언트를 끊는 수준.
- **멱등 키**: POST 재시도를 안전하게 (02·06장).

## 분산 시스템
- **split-brain**: 네트워크가 갈라져 클러스터가 둘로 나뉘면 각자 "내가 주인"이 된다. Hazelcast split-brain protection, merge policy.
- **CP Subsystem**: 강한 일관성이 필요한 카운터·락 (Raft). 이 프로젝트는 seq 를 고객이 붙여 분산 카운터를 피했다(19장).
- **Kubernetes**: Hazelcast k8s discovery, readiness/liveness probe, preStop 훅으로 드레인, HPA 와 WebSocket 연결의 불균형.
- **관측성**: Micrometer 메트릭(연결 수, 방 수, 재동기화 수, 프레임 지연), 분산 추적(trace id 를 STOMP 헤더로), 로그 상관 ID.
- **부하 테스트**: k6/Gatling 의 WebSocket 시나리오, 연결 수천 개 유지 시 메모리·스레드.

## 인증·보안
- **Refresh token 회전**, 토큰 **폐기 목록**(jti 블랙리스트를 공유 저장소에)
- **RS256 + JWKS**: 공개키 배포와 키 교체(kid)
- **JWE**: 토큰 내용 암호화가 꼭 필요할 때
- **mTLS**: 고객사 서버 ↔ 우리 서버를 API 키 대신 클라이언트 인증서로
- **Spring Security messaging** (`spring-security-messaging`)으로 인터셉터 대체
- **감사 로그**: 원격 조작(by, cmdId)을 별도 저장

## 화면 동기화
- **Shadow DOM / Web Components**: `attachShadow` 안의 노드는 일반 childNodes 로 안 보인다
- **같은 출처 iframe 재귀 복제**, cross-origin iframe 은 그 안에도 SDK 가 있어야 한다
- **CSSOM 변경 추적**: `CSSStyleSheet.prototype.insertRule` 을 감싸서 기록
- **canvas/video 실시간**: WebRTC 화면 공유와 DOM 방식의 혼합 (DOM 은 문서, 영상은 canvas 영역만)
- **이미지 프록시·캐시**: 상담사가 고객사 서버에 직접 요청하지 않게 (인증 필요한 이미지, 상담사 IP 노출 문제)
- **동시 편집 충돌**: 고객과 상담사가 같은 입력란을 동시에 고칠 때 — OT/CRDT
- **바이너리 프레임**: JSON 대신 MessagePack/CBOR, base64 오버헤드 제거
- **사전(dictionary) 압축 / 델타 압축**: 반복 구조를 더 줄이기
- **rrweb**: 오픈소스 DOM 녹화·재생 라이브러리 — 이 SDK 와 설계 비교해 보기 좋다
- **모바일 웹뷰·접근성**: 터치 이벤트, 화면 낭독기와의 공존
