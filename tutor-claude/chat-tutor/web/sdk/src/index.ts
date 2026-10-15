/**
 * SDK 진입점 — 고객사 개발자에게 공개하는 것만 export 한다 (20장).
 * 내부 구현(Recorder, Mirror 등)도 학습용으로 export 하지만, 실제 제품이라면
 * "공개 API"를 좁게 유지해야 나중에 내부를 바꿔도 고객사 코드가 깨지지 않는다.
 */
export { CobrowseCustomer, type CustomerOptions } from './customer.ts';
export { CobrowseAgent, type AgentOptions } from './agent.ts';
export { StompTransport, type ConnState } from './transport.ts';
export { Recorder } from './recorder.ts';
export { Mirror } from './mirror.ts';
export { encode, Decoder } from './codec.ts';
export { FrameSequencer, OrderedReceiver } from './sequencer.ts';
export { EchoGuard } from './echo-guard.ts';
export { backoffDelay } from './backoff.ts';
export { DEFAULT_MASK, type MaskOptions } from './masking.ts';
export * from './protocol.ts';

/** 빌드할 때 vite 가 package.json 의 version 으로 바꿔 넣는다 */
export const SDK_VERSION: string = typeof __SDK_VERSION__ === 'string' ? __SDK_VERSION__ : 'dev';
declare const __SDK_VERSION__: string | undefined;
