# web — 브라우저 쪽 코드 (TypeScript, Vite)

```
web/
├─ sdk/src/              화면 공유 SDK
│   ├─ protocol.ts       메시지 타입·주소(dest)·프로토콜 버전
│   ├─ node-ids.ts       노드 ↔ 번호
│   ├─ sanitize.ts       URL 절대화·속성 소독 (양쪽에서 사용)
│   ├─ masking.ts        마스킹 규칙
│   ├─ serializer.ts     DOM → JSON (스냅샷)
│   ├─ recorder.ts       스냅샷 + MutationObserver + 입력·스크롤·포인터 이벤트       [고객]
│   ├─ remote-control.ts 원격 명령 적용, ack                                      [고객]
│   ├─ customer.ts       고객 SDK 공개 API (CobrowseCustomer)                      [고객]
│   ├─ mirror.ts         JSON → iframe DOM 재현                                  [상담사]
│   ├─ overlay.ts        커서·강조 canvas                                         [상담사]
│   ├─ agent.ts          상담사 API (CobrowseAgent)                               [상담사]
│   ├─ bytes.ts · codec.ts      UTF-8·base64·gzip, 압축·조각·조립
│   ├─ sequencer.ts      epoch·seq, 순서·중복·공백 처리
│   ├─ echo-guard.ts     메아리 방지
│   ├─ backoff.ts        지수 백오프 + jitter
│   └─ transport.ts      STOMP 연결·재연결·재구독·close code 분기
├─ sdk/test/             vitest (jsdom)
├─ apps/customer/        고객사 사이트 예제 + SDK 위젯
├─ apps/agent/           상담사 콘솔 (CSP, sandbox iframe)
├─ labs/                 장별 실습 페이지 (07, 08, 12, 13, 15, 17)
├─ tenant-backend/       고객사 백엔드 흉내 (Node, :3000)
└─ e2e/                  Playwright: cobrowse.e2e.ts(단일 서버), cluster.e2e.ts(2노드 + 장애)
```

데이터 흐름: `Recorder → FrameSequencer → encode → StompTransport ⇢ 서버 ⇢ StompTransport → Decoder → OrderedReceiver → Mirror`
