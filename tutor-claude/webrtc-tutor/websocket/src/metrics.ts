/**
 * metrics.ts — 서버 내부 카운터 + Prometheus 텍스트 형식 출력
 *
 * "측정하지 않으면 개선할 수 없다." WebSocket 서버는 연결이 오래 유지되기 때문에
 * 일반 HTTP 서버와 달리 "현재 연결 수", "버퍼에 쌓인 바이트", "버려진 메시지 수" 같은
 * 상태성 지표가 장애를 가장 먼저 알려 줍니다.
 *
 *  - gauge   : 올라갔다 내려가는 값 (현재 연결 수)
 *  - counter : 계속 증가만 하는 값 (누적 메시지 수) — 그래프는 rate() 로 본다
 */
export class Metrics {
  /** gauge: 현재 연결 수 */
  connections = 0;

  // counters
  totalConnections = 0;
  messagesIn = 0;
  messagesOut = 0;
  dropped = 0; // 느린 소비자 때문에 버린 lossy 메시지
  rateLimited = 0;
  slowConsumers = 0; // 하드 리밋을 넘어 끊은 연결
  authFailures = 0;
  heartbeatTimeouts = 0;
  badMessages = 0;
  busPublished = 0;
  busReceived = 0;

  /** Prometheus exposition format. `GET /metrics` 로 노출하면 스크레이프 가능 */
  render(prefix = 'ws', extra: Record<string, number> = {}): string {
    const lines: string[] = [];
    const g = (name: string, help: string, v: number) => {
      lines.push(`# HELP ${prefix}_${name} ${help}`, `# TYPE ${prefix}_${name} gauge`, `${prefix}_${name} ${v}`);
    };
    const c = (name: string, help: string, v: number) => {
      lines.push(`# HELP ${prefix}_${name}_total ${help}`, `# TYPE ${prefix}_${name}_total counter`, `${prefix}_${name}_total ${v}`);
    };
    g('connections', 'Current open connections', this.connections);
    c('connections', 'Total accepted connections', this.totalConnections);
    c('messages_in', 'Messages received', this.messagesIn);
    c('messages_out', 'Messages sent', this.messagesOut);
    c('dropped', 'Lossy messages dropped due to slow consumers', this.dropped);
    c('rate_limited', 'Messages rejected by rate limiter', this.rateLimited);
    c('slow_consumers', 'Connections closed as slow consumers', this.slowConsumers);
    c('auth_failures', 'Rejected upgrade requests (auth/origin)', this.authFailures);
    c('heartbeat_timeouts', 'Connections terminated by heartbeat', this.heartbeatTimeouts);
    c('bad_messages', 'Malformed messages', this.badMessages);
    c('bus_published', 'Messages published to bus', this.busPublished);
    c('bus_received', 'Messages received from bus', this.busReceived);
    for (const [k, v] of Object.entries(extra)) g(k, k, v);
    return lines.join('\n') + '\n';
  }
}
