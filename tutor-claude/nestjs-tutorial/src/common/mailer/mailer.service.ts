/**
 * ============================================================================
 * MailerService — (학습용) 메일 발송 서비스
 * ----------------------------------------------------------------------------
 * 실제 SMTP/SES 연동 대신, 콘솔에 출력하는 목(mock) 구현입니다.
 * 핵심은 "동적 모듈이 주입해 준 옵션(MAILER_OPTIONS)을 어떻게 받는가" 입니다.
 * ============================================================================
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { MAILER_OPTIONS, MailerOptions, SendMailPayload } from './mailer.types';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(
    @Inject(MAILER_OPTIONS) private readonly options: MailerOptions,
  ) {}

  // 실제 전송이 없어 async 가 아니지만, 시그니처는 Promise 로 둡니다.
  // (나중에 nodemailer/SES 로 바꿔도 호출부를 안 고쳐도 되도록)
  send(payload: SendMailPayload): Promise<void> {
    const line = `메일 발송 [from=${this.options.from}] → to=${payload.to} / 제목="${payload.subject}"`;
    if (this.options.preview) {
      this.logger.debug(`(preview) ${line}\n---\n${payload.text}\n---`);
    } else {
      // 실무라면 여기서 await nodemailer/AWS SES 호출
      this.logger.log(line);
    }
    return Promise.resolve();
  }

  /** 회원가입 환영 메일 (도메인 특화 헬퍼) */
  async sendWelcome(to: string, nickname: string): Promise<void> {
    await this.send({
      to,
      subject: '가입을 환영합니다 🎉',
      text: `${nickname}님, NestJS 튜토리얼 게시판에 오신 것을 환영합니다!`,
    });
  }
}
