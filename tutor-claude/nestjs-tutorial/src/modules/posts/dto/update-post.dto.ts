import { PartialType } from '@nestjs/swagger';
import { CreatePostDto } from './create-post.dto';

/** 모든 필드 옵셔널 (PATCH). 검증 규칙은 상속. */
export class UpdatePostDto extends PartialType(CreatePostDto) {}
