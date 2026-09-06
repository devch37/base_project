/**
 * ============================================================================
 * seed.ts — 초기 데이터 삽입 로직
 * ----------------------------------------------------------------------------
 * 관리자 1명 + 일반 사용자 2명 + 게시글/댓글 몇 개를 만듭니다.
 * DataSource 를 직접 받아 Repository 로 작업합니다(Nest 컨텍스트 불필요).
 * ============================================================================
 */
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { Comment } from '../../modules/comments/entities/comment.entity';
import { Post } from '../../modules/posts/entities/post.entity';
import { Tag } from '../../modules/posts/entities/tag.entity';
import { User } from '../../modules/users/entities/user.entity';

export async function seed(dataSource: DataSource): Promise<void> {
  const users = dataSource.getRepository(User);
  const posts = dataSource.getRepository(Post);
  const tags = dataSource.getRepository(Tag);
  const comments = dataSource.getRepository(Comment);

  // 이미 데이터가 있으면 건너뛴다 (멱등하게)
  if ((await users.count()) > 0) {
    console.log('ℹ️  이미 데이터가 있어 시드를 건너뜁니다.');
    return;
  }

  const password = await bcrypt.hash('Passw0rd!', 10);

  const [admin, alice, bob] = await users.save([
    users.create({
      email: 'admin@example.com',
      nickname: '관리자',
      password,
      role: Role.ADMIN,
    }),
    users.create({ email: 'alice@example.com', nickname: '앨리스', password }),
    users.create({ email: 'bob@example.com', nickname: '밥', password }),
  ]);

  const [nestTag, tsTag] = await tags.save([
    tags.create({ name: 'nestjs' }),
    tags.create({ name: 'typescript' }),
  ]);

  const post1 = await posts.save(
    posts.create({
      title: 'NestJS 시작하기',
      content: '모듈, 컨트롤러, 프로바이더의 개념을 알아봅시다.',
      authorId: alice.id,
      tags: [nestTag, tsTag],
    }),
  );
  await posts.save(
    posts.create({
      title: '의존성 주입이란?',
      content: 'IoC 컨테이너가 객체 생성을 대신해 줍니다.',
      authorId: bob.id,
      tags: [nestTag],
    }),
  );

  await comments.save([
    comments.create({
      content: '좋은 글 감사합니다!',
      authorId: bob.id,
      postId: post1.id,
    }),
    comments.create({
      content: '정리가 깔끔하네요.',
      authorId: admin.id,
      postId: post1.id,
    }),
  ]);

  console.log('✅ 시드 완료: 사용자 3명, 게시글 2개, 댓글 2개');
  console.log(
    '   로그인: admin@example.com / alice@example.com / bob@example.com  (비번: Passw0rd!)',
  );
}
