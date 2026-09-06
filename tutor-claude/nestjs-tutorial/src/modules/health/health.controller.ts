/**
 * ============================================================================
 * health.controller.ts — 헬스체크 / 라이브니스
 * ----------------------------------------------------------------------------
 * 로드밸런서·쿠버네티스가 "이 인스턴스가 살아있고 트래픽을 받아도 되는지" 확인합니다.
 *   · liveness  : 프로세스가 죽지 않았는가 (/health)
 *   · readiness : 의존 자원(DB 등)이 준비됐는가 (/health/ready)
 *
 * 실무에서는 @nestjs/terminus 를 쓰면 DB/디스크/메모리 체크를 표준화할 수 있습니다.
 * 여기서는 의존성을 줄이기 위해 직접 구현합니다.
 * ============================================================================
 */
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Public } from '../../common/decorators/public.decorator';
import { SkipTransform } from '../../common/interceptors/skip-transform.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Public()
  @SkipTransform()
  @Get()
  @ApiOperation({ summary: 'liveness — 프로세스 생존 확인' })
  liveness() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @SkipTransform()
  @Get('ready')
  @ApiOperation({ summary: 'readiness — DB 연결까지 확인' })
  async readiness() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', db: 'up' };
    } catch {
      // 503 → 로드밸런서가 이 인스턴스로 트래픽을 보내지 않게 함
      throw new ServiceUnavailableException({ status: 'error', db: 'down' });
    }
  }
}
