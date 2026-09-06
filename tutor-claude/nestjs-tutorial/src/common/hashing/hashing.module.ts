import { Global, Module } from '@nestjs/common';
import { HashingService } from './hashing.service';

/**
 * @Global() — 앱 전체에서 HashingService 를 import 없이 주입 가능.
 * (auth, users 등 여러 모듈에서 공통으로 필요하므로 전역이 편함)
 */
@Global()
@Module({
  providers: [HashingService],
  exports: [HashingService],
})
export class HashingModule {}
