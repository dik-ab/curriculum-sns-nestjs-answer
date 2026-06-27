import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

function getSetCookie(res: request.Response): string[] {
  const cookie = res.headers['set-cookie'];
  if (!cookie) throw new Error('Set-Cookie header is missing');
  return Array.isArray(cookie) ? cookie : [cookie];
}

describe('Follow API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let aliceCookie: string[];
  let bobCookie: string[];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    prisma = app.get(PrismaService);

    // 参照している側のテーブルから順に全削除する
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.like.deleteMany();
    await prisma.post.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.emailVerificationToken.deleteMany();
    await prisma.user.deleteMany();

    // テストユーザーを2人、DBに直接作る
    const passwordHash = await bcrypt.hash('password123', 10);
    await prisma.user.createMany({
      data: [
        {
          email: 'alice@example.com',
          username: 'alice',
          displayName: 'アリス',
          passwordHash,
          emailVerified: true,
        },
        {
          email: 'bob@example.com',
          username: 'bob',
          displayName: 'ボブ',
          passwordHash,
          emailVerified: true,
        },
      ],
    });

    // ログインしてそれぞれのHttpOnly Cookieを取得する
    const aliceRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'alice@example.com', password: 'password123' });
    aliceCookie = getSetCookie(aliceRes);

    const bobRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'bob@example.com', password: 'password123' });
    bobCookie = getSetCookie(bobRes);

    expect(aliceCookie).toBeDefined();
    expect(bobCookie).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Cookieなしではフォローできない（401）', async () => {
    await request(app.getHttpServer()).post('/users/bob/follow').expect(401);
  });

  it('aliceがbobをフォローすると201が返る', async () => {
    await request(app.getHttpServer())
      .post('/users/bob/follow')
      .set('Cookie', aliceCookie)
      .expect(201);
  });

  it('同じ相手への二重フォローは409が返る', async () => {
    await request(app.getHttpServer())
      .post('/users/bob/follow')
      .set('Cookie', aliceCookie)
      .expect(409);
  });

  it('bobのプロフィールにフォロー状態が反映される', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/bob')
      .set('Cookie', aliceCookie)
      .expect(200);

    expect(res.body.isFollowing).toBe(true);
    expect(res.body.followersCount).toBe(1);
  });

  it('フォロー中タイムラインにbobの投稿が表示される', async () => {
    await request(app.getHttpServer())
      .post('/posts')
      .set('Cookie', bobCookie)
      .send({ content: 'ボブの投稿です' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/posts/timeline')
      .set('Cookie', aliceCookie)
      .expect(200);

    const contents = res.body.map((post: { content: string }) => post.content);
    expect(contents).toContain('ボブの投稿です');
  });

  it('フォローを解除するとタイムラインからbobの投稿が消える', async () => {
    await request(app.getHttpServer())
      .delete('/users/bob/follow')
      .set('Cookie', aliceCookie)
      .expect(204);

    const res = await request(app.getHttpServer())
      .get('/posts/timeline')
      .set('Cookie', aliceCookie)
      .expect(200);

    const contents = res.body.map((post: { content: string }) => post.content);
    expect(contents).not.toContain('ボブの投稿です');
  });
});
