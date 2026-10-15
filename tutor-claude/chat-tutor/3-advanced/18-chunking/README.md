# 18. 큰 메시지 조각내기 — 조각 번호 · 전송 ID · 복원 · 타임아웃

## 이 장의 목표
- 메시지 크기 제한이 **여러 겹**으로 존재한다는 것을 실측으로 안다 (★ Tomcat 기본 8KB).
- 조각 프로토콜(전송 ID, 조각 번호, 총 개수)을 설계하고 조립기를 구현할 수 있다.
- 조립 중 문제(순서 섞임, 중복, 유실, 메모리 폭주)를 각각 어떻게 다루는지 설명할 수 있다.

## 프로젝트에서 이 장의 자리
상품 목록이 긴 페이지의 스냅샷은 압축해도 수십~수백 KB 다. `codec.ts` 의 `encode()` 가 큰 프레임을 조각내고 `Decoder` 가 조립한다.
서버는 조각을 **풀어 보지 않고** 그대로 중계한다.

---

## 1. 왜 조각내나

1. **크기 한도** — 넘으면 메시지 하나가 아니라 **연결 전체**가 끊긴다(close 1009).
2. **줄 서기(head-of-line blocking)** — 300KB 메시지 하나가 연결을 점유하는 동안 뒤의 채팅·커서 메시지가 다 기다린다.
   조각으로 나누면 (이 프로젝트는 아직 조각 사이에 끼워 보내지는 않지만) 각 메시지가 작아져 버퍼·지연이 예측 가능해진다.
3. **메모리** — 서버·프록시가 메시지 하나를 통째로 버퍼에 담는다. 작을수록 안전하다.

## 2. ★ 크기 한도는 여러 겹 (가장 작은 것이 실제 한도)

| 층 | 기본값 | 넘으면 | 이 프로젝트 |
|---|---|---|---|
| 브라우저/클라이언트 수신 버퍼 | 구현마다 다름 (JDK 클라이언트 8KB) | 클라이언트가 끊음 | 테스트 클라이언트 1MB 로 올림 (`TestStomp`) |
| 프록시 (nginx 등) | 설정에 따라 | 프록시가 끊음 | 21장 |
| **Tomcat WebSocket 텍스트 버퍼** | **8KB** | **1009 "The decoded text message was too big…"** | 128KB (`WebSocketContainerConfig`) |
| Spring STOMP `messageSizeLimit` | 64KB | 연결 종료 | 128KB (`StompConfig`) |
| SDK 조각 크기 | — | — | **32KB** (위 한도들보다 충분히 작게) |

**실측**: `server/stomp-chat` 은 Tomcat 버퍼를 설정하지 않았다. `MessageSizeTest` 에서
- 7KB 메시지 → 컨트롤러까지 도착 (1000자 검증 오류가 돌아옴 = 도착했다는 증거)
- 20KB 메시지 → Spring 64KB 한도에 한참 못 미치는데도 **Tomcat 이 1009 로 끊는다**

"Spring 문서에 64KB 라고 했는데요?" — 그 앞에 Tomcat 이 있다. 크기 문제는 **모든 층**을 확인해야 한다.

## 3. 조각 프로토콜

```json
{"k":"c","id":"mv0j8lh1-3-29o4","i":0,"n":4,"d":"H4sIAAAAAAAA..."}
{"k":"c","id":"mv0j8lh1-3-29o4","i":1,"n":4,"d":"..."}
...
```
| 필드 | 역할 |
|---|---|
| `id` (전송 ID) | 어느 메시지의 조각인가. 여러 큰 메시지의 조각이 섞여 와도 구분 |
| `i` (조각 번호) | 이어 붙일 순서 |
| `n` (총 개수) | 다 모였는지 판단 |
| `d` | gzip+base64 문자열의 일부 (조각마다 압축하지 않고, **전체를 압축한 뒤** 자른다 → 압축 효율↑) |

조각 하나의 크기 = `maxMessageBytes - 200`(껍데기 여유). base64 는 ASCII 라 글자 수 = 바이트 수.

## 4. 조립 (`Decoder.collect`)

| 문제 | 처리 |
|---|---|
| 순서가 섞여 도착 | `parts[i] = d` 로 자리에 꽂고, 다 모이면 `join('')` |
| 같은 조각 중복 | 이미 있으면 무시 (멱등) |
| 조각 유실 | 첫 조각 도착 후 `timeoutMs`(5초) 안에 안 모이면 **버리고 onDrop** → 상담사 SDK 가 재동기화 요청 (19장) |
| 조각만 끝없이 옴 (버그·악의) | 동시 조립 수 `maxTransfers`(8), 총 버퍼 `maxBufferedBytes`(8MB) 초과 시 거절 |
| 이상한 값 (`n=1e9`, `i<0`) | `invalid` 로 거절 |

재전송(빠진 조각만 다시 보내기)은 하지 않는다. 화면 공유에서는 "처음부터 새 스냅샷"이 더 단순하고 확실하다.

---

## 코드 읽기
- `web/sdk/src/codec.ts` — `encode()`(f → z → c), `Decoder`(collect, expire, drop, release)
- `server/cobrowse-server/.../config/WebSocketContainerConfig`, `StompConfig.configureWebSocketTransport`
- `server/stomp-chat/src/test/.../MessageSizeTest` — 8KB 실측
- `server/cobrowse-server/src/test/.../CobrowseFlowTest.크기_한도_안의_큰_프레임은…` — 100KB 통과, 200KB 끊김
- `3-advanced/18-chunking/chunk-demo.ts`

## 직접 해 보기
```bash
npm run lab:18
./gradlew :server:stomp-chat:test --tests '*MessageSizeTest*' -i | grep -i "too big"
```
1. `lab:18`: 메시지 한도별 조각 개수, 뒤섞어도 복원, 첫 조각 유실 → 타임아웃 → 메모리 반환.
2. labs/15 에서 "메시지 최대" 를 1000B, "손실률" 을 10% → 조각 유실로 재동기화가 일어나는 것 관찰.
3. (도전) `cobrowse-server` 의 `chat.max-message-bytes` 를 16384 로 낮추고, SDK 조각 크기(32KB)는 그대로 둔 채 최종 앱을 써 보라. 무슨 일이? (그다음 원복)

## 자주 하는 실수
- Spring 설정만 보고 Tomcat·프록시 한도를 잊음.
- 조각마다 따로 압축 → 압축률이 크게 떨어짐.
- 조립 버퍼에 타임아웃·상한이 없음 → 유실 조각 하나가 메모리를 영원히 잡음.
- 조각 크기를 글자 수로 계산 (base64 가 아닌 원문을 자르면 한글 때문에 바이트가 달라진다).

## 확인 질문
1. 조각 4개 중 3번만 영영 안 온다. 상담사 화면은 어떻게 되나?
2. 전송 ID 없이 조각 번호만 쓰면 생기는 문제는?
3. 서버 한도 128KB, SDK 조각 32KB. 굳이 그렇게 작게 자르는 이유는?

<details><summary>답</summary>

1. 5초 뒤 조립을 버리고(onDrop) 재동기화 요청 → 고객이 새 스냅샷을 보냄.
2. 큰 메시지 두 개의 조각이 섞이면 어느 것의 0번인지 구분할 수 없다.
3. 프록시·클라이언트 등 다른 층의 한도가 더 작을 수 있고, 메시지가 작을수록 버퍼·지연이 예측 가능하다.
</details>

## 연습
- `exercises/src/06-chunker.ts`

다음 → [19. 순서 · 중복 · 손실과 재동기화](../19-order-loss-resync/)
