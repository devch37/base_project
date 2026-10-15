# 용어집

| 용어 | 뜻 | 처음 나오는 장 |
|---|---|---|
| Origin (출처) | scheme + host + port. 같아야 "같은 출처" | 01 |
| Same-Origin Policy | 다른 출처의 응답·DOM 을 JS 가 마음대로 읽지 못하게 하는 브라우저 규칙 | 01, 22 |
| DNS | 도메인 이름 → IP 주소 | 01 |
| TCP | 순서대로 빠짐없이 바이트를 나르는 연결. HTTP·WebSocket 의 바탕 | 01 |
| 멱등(idempotent) | 여러 번 해도 한 번 한 것과 결과가 같음 (GET, PUT, DELETE) | 02 |
| ProblemDetail | RFC 9457 오류 응답 형식 (`type`, `title`, `status`, `detail`) | 05 |
| 이벤트 루프 | 동기 코드 → 마이크로태스크 → 매크로태스크 순으로 일을 처리하는 JS 실행 모델 | 03 |
| 마이크로태스크 | Promise.then, await 뒤, MutationObserver 콜백 | 03, 15 |
| DI (의존성 주입) | 필요한 객체를 직접 만들지 않고 컨테이너가 넣어 주는 방식 | 05 |
| Bean | Spring 컨테이너가 만들고 관리하는 객체 | 05 |
| DTO | 밖과 주고받는 데이터 모양 (요청/응답 객체) | 05 |
| 타임아웃 (연결/읽기) | 연결 맺기까지 / 응답 오기까지 기다리는 최대 시간 | 06 |
| fallback (대체값) | 외부 호출이 실패했을 때 대신 쓰는 값 | 06 |
| WebSocket | HTTP 로 시작해 101 로 갈아탄, 양방향 지속 연결 | 07 |
| 핸드셰이크 | WebSocket 을 열기 위한 HTTP GET + Upgrade 요청/101 응답 | 07 |
| close code | WebSocket 종료 이유 번호 (1000, 1001, 1006, 1008, 1009, 4xxx) | 07 |
| ping/pong | WebSocket 프레임 수준의 연결 확인 | 07 |
| STOMP | WebSocket 위의 텍스트 메시징 프로토콜 (CONNECT, SEND, SUBSCRIBE…) | 08 |
| 프레임 (STOMP) | 명령 + 헤더 + 빈 줄 + 본문 + `\0` | 08 |
| Pub/Sub | 발행자와 구독자가 주소(토픽)만 알고 서로는 모르는 메시징 방식 | 08 |
| 메시지 브로커 | 주소별 구독자에게 메시지를 나눠 주는 중개자 (simple broker = 서버 메모리) | 08 |
| destination | STOMP 주소. `/app`(컨트롤러), `/topic`(방송), `/queue`, `/user` | 08 |
| heartbeat | STOMP 계층의 주기적 생존 신호 (줄바꿈 한 글자) | 09 |
| 지수 백오프 + jitter | 실패할수록 대기를 늘리고 무작위로 흩뜨리는 재시도 전략 | 09 |
| presence | 누가 지금 방에 있는지 (접속 상태) | 09, 23 |
| 인증 / 인가 | 누구인가(401) / 해도 되는가(403) | 10 |
| 세션 / 쿠키 | 서버에 상태 저장 + 브라우저는 ID 쿠키만 | 10 |
| JWT | 헤더.페이로드.서명 형태의 서명된 토큰 | 11 |
| 클레임 | JWT 페이로드의 항목 (sub, exp, role …) | 11 |
| JWS / JWE | 서명된 JWT / 암호화된 JWT | 11 |
| Bearer 토큰 | 가진 사람을 주인으로 믿는 토큰 (`Authorization: Bearer …`) | 11 |
| 내부 API 키 | 서버 간 호출에서 고객사 서버의 신원 (`X-Api-Key`) | 11 |
| clock skew | 서버 간 시계 오차 허용 | 11 |
| ChannelInterceptor | STOMP 프레임마다 실행되는 Spring 인터셉터 | 12 |
| default deny | 명시적으로 허용한 것만 허용 | 12 |
| Principal | 인증된 사용자 객체 | 12 |
| DOM | HTML 을 파싱해 만든 메모리 속 노드 트리 | 13 |
| attribute / property | HTML 초기값 / 현재 값 (input.value) | 13 |
| 캡처 / 버블 | 이벤트가 바깥→안 / 안→바깥 으로 전파되는 단계 | 13 |
| isTrusted | 이벤트가 실제 사용자 동작인지 | 13, 17 |
| UTF-8 / UTF-16 | 웹 표준 바이트 인코딩 / JS 문자열 내부 표현 | 14 |
| base64 | 바이트를 안전한 64개 글자로 (+33%) | 14 |
| gzip | DEFLATE 압축 형식 | 14 |
| 스냅샷 / 변경분(mutation) | 화면 전체 / 바뀐 부분 | 15 |
| MutationObserver | DOM 변경(노드·속성·텍스트)을 묶어서 알려 주는 브라우저 API | 15 |
| epoch / seq | 스냅샷 단위 ID / 그 안의 순번 | 15, 19 |
| 노드 ID | 고객·상담사가 같은 노드를 가리키는 번호 | 15 |
| sandbox (iframe) | iframe 의 스크립트·폼·이동 등을 제한하는 속성 | 16, 22 |
| overlay | 복제본 위에 겹쳐 그리는 투명 canvas | 16 |
| 에코 루프 | 동기화 이벤트가 양쪽을 오가며 반복되는 현상 | 17 |
| ack | 명령 처리 결과 응답 | 17 |
| 조각(chunk) / 전송 ID | 큰 메시지를 나눈 조각 / 어느 메시지의 조각인지 | 18 |
| 재동기화(resync) | 새 스냅샷부터 다시 맞추기 | 19 |
| SDK | 남의 서비스(고객사 사이트)에 끼워 쓰는 라이브러리 | 20 |
| IIFE / ES 모듈 | `<script>` 로 쓰는 즉시 실행 번들 / import 로 쓰는 모듈 | 20 |
| TLS | 전송 구간 암호화 (https, wss) | 21 |
| 리버스 프록시 | 서버 앞에서 요청을 받아 뒤로 넘기는 서버 (nginx) | 21 |
| hop-by-hop 헤더 | 바로 옆 구간에만 의미 있는 헤더 (Connection, Upgrade) | 21 |
| idle timeout | 조용한 연결을 끊는 프록시 설정 | 21 |
| CORS | 다른 출처의 HTTP 응답을 JS 가 읽어도 되는지 서버가 허락하는 규칙 | 22 |
| CSWSH | 다른 사이트가 피해자의 쿠키로 WebSocket 을 여는 공격 | 22 |
| XSS | 남의 스크립트가 내 페이지에서 실행되는 공격 | 22 |
| CSP | 페이지가 실행·로드할 수 있는 출처를 제한하는 정책 | 22 |
| 마스킹 | 개인정보를 보내기 전에 가리기 | 22 |
| 로드밸런서 | 요청·연결을 여러 서버에 나누는 장치 | 23 |
| sticky session | 같은 사용자를 같은 서버로 보내는 방식 | 23 |
| Hazelcast | 자바 인메모리 데이터 그리드 (클러스터, IMap, ITopic) | 23 |
| ITopic / IMap | 흘려보내는 Pub/Sub 메시지 / 저장되는 분산 Map | 23 |
| TTL | 저장된 데이터의 유통기한 | 23 |
| graceful shutdown | 진행 중 작업을 마무리하고 종료 | 24 |
