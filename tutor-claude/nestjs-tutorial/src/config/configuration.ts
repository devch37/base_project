/**
 * ============================================================================
 * configuration.ts — 타입이 있는 설정 팩토리
 * ----------------------------------------------------------------------------
 * @nestjs/config 는 process.env 를 그냥 문자열로 넘겨줍니다.
 * 여기서 "구조화 + 타입 변환(숫자/불리언)"을 한 번에 처리하고,
 * registerAs() 로 네임스페이스를 나눠 주입받기 쉽게 만듭니다.
 *
 *   constructor(
 *     @Inject(appConfig.KEY) private readonly cfg: ConfigType<typeof appConfig>,
 *   ) {}
 * ============================================================================
 */
import { registerAs } from '@nestjs/config';

/** 앱 전역 설정 */
export const appConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api',
}));

/** 데이터베이스 설정 */
export const databaseConfig = registerAs('database', () => ({
  database: process.env.DB_DATABASE ?? 'data/dev.sqlite',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
}));

/** JWT(액세스/리프레시) 설정 */
export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
}));

/** 요청 제한(rate limit) 설정 */
export const throttleConfig = registerAs('throttle', () => ({
  ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
  limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
}));

/** 캐시 설정 */
export const cacheConfig = registerAs('cache', () => ({
  ttl: parseInt(process.env.CACHE_TTL ?? '5000', 10),
}));

/** ConfigModule.load 에 한 번에 넘기기 위한 배열 */
export const configurations = [
  appConfig,
  databaseConfig,
  jwtConfig,
  throttleConfig,
  cacheConfig,
];
