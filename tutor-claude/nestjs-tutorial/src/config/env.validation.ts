/**
 * ============================================================================
 * env.validation.ts — 환경변수 스키마 검증 (Joi)
 * ----------------------------------------------------------------------------
 * 앱이 뜨는 순간(부트스트랩)에 필요한 환경변수가 없거나 형식이 틀리면
 * "서버가 켜지기 전에" 즉시 실패시키는 것이 중요합니다.
 * (운영 중에 특정 요청에서야 undefined 로 터지는 것보다 훨씬 낫습니다)
 * ============================================================================
 */
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api'),

  DB_DATABASE: Joi.string().default('data/dev.sqlite'),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),

  // 시크릿은 기본값을 주지 않고 "필수"로 강제하는 것이 안전합니다.
  // (학습 편의를 위해 여기서는 min 길이만 검증)
  JWT_ACCESS_SECRET: Joi.string().min(8).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(8).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),
  CACHE_TTL: Joi.number().default(5000),
});
