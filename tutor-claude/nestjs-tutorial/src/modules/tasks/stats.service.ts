/**
 * ============================================================================
 * stats.service.ts — 스케줄러(@nestjs/schedule) 예제
 * ----------------------------------------------------------------------------
 * 데코레이터 3종:
 *   @Cron(...)      cron 식 기반 (아래 예시는 CronExpression.EVERY_30_SECONDS)
 *   @Interval(ms)   고정 간격 반복
 *   @Timeout(ms)    앱 시작 후 1회
 *
 * 주의(실무): 인스턴스를 여러 개(수평 확장) 띄우면 크론이 "모든 인스턴스에서" 돕니다.
 *   → 분산 락(Redis) 또는 전용 워커 프로세스로 단일 실행을 보장해야 합니다.
 *
 * SchedulerRegistry 로 런타임에 잡을 추가/삭제/조회할 수도 있습니다.
 * ============================================================================
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, Interval, Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);
  private tickCount = 0;

  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Post) private readonly postsRepo: Repository<Post>,
  ) {}

  @Timeout(3000)
  async logStartupSnapshot(): Promise<void> {
    const [users, posts] = await Promise.all([
      this.usersRepo.count(),
      this.postsRepo.count(),
    ]);
    this.logger.log(`시작 스냅샷 — 사용자 ${users}명 / 게시글 ${posts}개`);
  }

  @Cron(CronExpression.EVERY_30_SECONDS, { name: 'stats-heartbeat' })
  async heartbeat(): Promise<void> {
    const posts = await this.postsRepo.count();
    this.logger.debug(`[cron] 게시글 수: ${posts}`);
  }

  @Interval('tick-counter', 60_000)
  countTicks(): void {
    this.tickCount += 1;
    this.logger.debug(`[interval] 앱이 살아있은 지 약 ${this.tickCount}분`);
  }
}
