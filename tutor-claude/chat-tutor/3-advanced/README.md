# 3단계 · 화면 동기화와 데이터 전송 (13~19)

| 장 | 한 줄 요약 |
|---|---|
| [13](13-html-dom-events/) | DOM = 메모리 속 트리. **attribute ≠ property**. 캡처 단계로 먼저 듣기. `isTrusted` |
| [14](14-bytes-encoding-compression/) | 크기는 **바이트**로 (한글 3, 이모지 4). base64 +33%. 반복 많은 JSON 은 gzip 으로 ~6% |
| [15](15-dom-snapshot-mutation/) | 스냅샷 1회 + 변경분. MutationObserver 가 못 잡는 입력·스크롤은 이벤트로. **노드 ID** |
| [16](16-render-iframe-canvas-overlay/) | sandbox iframe 에 소독하며 재현, 커서는 canvas overlay. CSS·이미지·스크립트·canvas 의 한계 |
| [17](17-remote-control-echo/) | 동의 + 화이트리스트 + 보호 필드. 에코 방지 = isTrusted + EchoGuard + **ack/cmdId** |
| [18](18-chunking/) | 크기 한도는 여러 겹(**Tomcat 8KB**). 전송 ID·번호·총수, 중복 무시, 타임아웃, 메모리 상한 |
| [19](19-order-loss-resync/) | epoch + seq. Spring 기본은 **병렬 처리로 순서가 섞인다**(실측). 손실엔 재전송 대신 재동기화 |
