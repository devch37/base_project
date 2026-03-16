/**
 * ============================================
 * Create Post Use Case - 입력/출력 DTO
 * ============================================
 *
 * Application Layer의 DTO는 Presentation Layer DTO와 다름:
 * - Presentation DTO: HTTP 요청/응답 형식
 * - Application DTO: Use Case 입출력 (순수 데이터)
 *
 * 이 분리의 이점:
 * - Application Layer가 HTTP에 독립적
 * - CLI, gRPC 등 다른 인터페이스로도 Use Case 사용 가능
 */

export interface CreatePostCommand {
  title: string;
  content: string;
  authorId: number;
  authorEmail: string;
  tags?: string[];
}

export interface CreatePostResult {
  id: number;
  title: string;
  content: string;
  authorId: number;
  published: boolean;
  tags: string[];
  createdAt: Date;
}
