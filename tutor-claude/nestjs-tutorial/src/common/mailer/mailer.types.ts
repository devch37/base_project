/** MailerModule 설정 옵션 */
export interface MailerOptions {
  /** 보내는 사람 주소 (예: "no-reply@example.com") */
  from: string;
  /** true 면 실제 전송 대신 콘솔에만 출력 (개발/테스트용) */
  preview?: boolean;
}

/** forRootAsync 로 옵션을 비동기 주입할 때 사용하는 형태 */
export interface MailerAsyncOptions {
  imports?: any[];
  inject?: any[];
  useFactory: (...args: any[]) => MailerOptions | Promise<MailerOptions>;
}

export interface SendMailPayload {
  to: string;
  subject: string;
  text: string;
}

/** DI 토큰 (문자열 상수를 토큰으로 사용) */
export const MAILER_OPTIONS = 'MAILER_OPTIONS';
