/**
 * @SkipTransform() — 이 라우트는 표준 응답 봉투로 감싸지 않는다.
 * (예: 204 No Content, 파일 스트림, 서드파티가 특정 형식을 요구하는 웹훅 등)
 */
import { SetMetadata } from '@nestjs/common';
import { SKIP_TRANSFORM_KEY } from './transform.interceptor';

export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM_KEY, true);
