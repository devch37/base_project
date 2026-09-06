(function () {
/**
 * 26-breakout.js — 벽돌깨기 (완전히 플레이 가능한 미니 게임)
 * ------------------------------------------------------------------
 * 지금까지 배운 도형 그리기 + 충돌 감지(15-bouncing-balls.js) + 키보드/마우스
 * 입력(12-draw-app.js) 을 모두 합치면 완성된 게임 루프를 만들 수 있습니다.
 *
 *  - 게임 루프의 정석 패턴: 매 프레임 "입력 반영 → 물리 갱신 → 충돌 판정 → 그리기"
 *    를 requestAnimationFrame 으로 반복합니다.
 *  - 공-벽돌 충돌은 AABB(사각형) 판정으로 하고, 어느 축에서 부딪혔는지에 따라
 *    vx 또는 vy 의 부호만 뒤집어 "튕겨나가는" 방향을 결정합니다.
 *  - 패들에 맞을 때는 맞은 위치(패들 중심에서 얼마나 떨어졌는지)에 따라
 *    반사각을 다르게 줘서, 실제 벽돌깨기 게임처럼 원하는 방향으로 조준할 수 있습니다.
 *  - 마우스로 패들을 움직이거나, ←/→ 방향키로도 조작할 수 있습니다.
 */
registerDemo({
  id: 'breakout',
  category: '8. 3D & 게임',
  title: '벽돌깨기 게임',
  desc: '충돌 감지 + 키보드/마우스 입력으로 완성한 플레이 가능한 미니 게임',
  file: 'js/demos/26-breakout.js',
  points: [
    '게임 루프 = 매 프레임 "입력 반영 → 물리 갱신 → 충돌 판정 → 그리기" 의 반복입니다.',
    '공-벽돌 충돌은 사각형 AABB 판정으로 감지하고, 부딪힌 축의 속도 부호를 뒤집어 반사시킵니다.',
    '패들의 맞은 위치(중심에서의 거리)를 반사각에 반영해 조준 플레이가 가능하게 했습니다.',
    '마우스 이동과 방향키 입력을 동시에 지원해 두 가지 조작 방식을 모두 받아들입니다.',
  ],
  init(ctx, canvas, helpers) {
    let W = helpers.width();
    let H = helpers.height();

    const paddle = { w: 90, h: 12, x: W / 2 - 45, y: H - 30, speed: 7 };
    const ball = { x: W / 2, y: paddle.y - 10, r: 7, vx: 3.2, vy: -4.2, stuck: true };
    const keys = { left: false, right: false };
    let mouseX = null;

    const ROWS = 5,
      COLS = 9;
    let bricks = [];
    let score = 0;
    let lives = 3;
    let gameState = 'playing'; // 'playing' | 'gameover' | 'win'

    function layoutBricks() {
      bricks = [];
      const margin = 14;
      const gap = 6;
      const brickW = (W - margin * 2 - gap * (COLS - 1)) / COLS;
      const brickH = 18;
      const rowColors = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7'];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          bricks.push({
            x: margin + c * (brickW + gap),
            y: 50 + r * (brickH + gap),
            w: brickW,
            h: brickH,
            alive: true,
            color: rowColors[r % rowColors.length],
          });
        }
      }
    }
    layoutBricks();

    function resetBall() {
      ball.x = paddle.x + paddle.w / 2;
      ball.y = paddle.y - ball.r - 1;
      ball.vx = 3.2 * (Math.random() < 0.5 ? -1 : 1);
      ball.vy = -4.2;
      ball.stuck = true;
    }

    function restartGame() {
      W = helpers.width();
      H = helpers.height();
      paddle.x = W / 2 - paddle.w / 2;
      paddle.y = H - 30;
      score = 0;
      lives = 3;
      gameState = 'playing';
      layoutBricks();
      resetBall();
    }

    helpers.controls.innerHTML = `<span style="color:var(--text-dim)">← → 방향키 또는 마우스로 패들 조작, Space/클릭으로 공 발사</span> <button id="bo-restart">새 게임</button>`;
    helpers.on(document.getElementById('bo-restart'), 'click', restartGame);

    helpers.on(window, 'keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        keys.left = true;
        e.preventDefault();
      }
      if (e.key === 'ArrowRight') {
        keys.right = true;
        e.preventDefault();
      }
      if (e.key === ' ') {
        if (ball.stuck) ball.stuck = false;
        if (gameState !== 'playing') restartGame();
        e.preventDefault();
      }
    });
    helpers.on(window, 'keyup', (e) => {
      if (e.key === 'ArrowLeft') keys.left = false;
      if (e.key === 'ArrowRight') keys.right = false;
    });
    helpers.on(canvas, 'pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
    });
    helpers.on(canvas, 'pointerdown', () => {
      if (ball.stuck) ball.stuck = false;
      else if (gameState !== 'playing') restartGame();
    });

    function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
      return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    }

    helpers.loop(() => {
      // ---------- 입력 반영 ----------
      if (mouseX !== null) paddle.x = mouseX - paddle.w / 2;
      if (keys.left) paddle.x -= paddle.speed;
      if (keys.right) paddle.x += paddle.speed;
      paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));

      if (gameState === 'playing') {
        if (ball.stuck) {
          ball.x = paddle.x + paddle.w / 2;
          ball.y = paddle.y - ball.r - 1;
        } else {
          // ---------- 물리 갱신 ----------
          ball.x += ball.vx;
          ball.y += ball.vy;

          // 벽 충돌
          if (ball.x - ball.r < 0) {
            ball.x = ball.r;
            ball.vx *= -1;
          } else if (ball.x + ball.r > W) {
            ball.x = W - ball.r;
            ball.vx *= -1;
          }
          if (ball.y - ball.r < 0) {
            ball.y = ball.r;
            ball.vy *= -1;
          }

          // 패들 충돌: 맞은 위치(-1~1)에 따라 반사각을 다르게 줌
          if (
            ball.vy > 0 &&
            rectsOverlap(ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2, paddle.x, paddle.y, paddle.w, paddle.h)
          ) {
            const hitPos = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2); // -1(왼쪽 끝) ~ 1(오른쪽 끝)
            const speed = Math.hypot(ball.vx, ball.vy);
            const angle = hitPos * (Math.PI / 3); // 최대 60도까지 꺾어서 반사
            ball.vx = speed * Math.sin(angle);
            ball.vy = -Math.abs(speed * Math.cos(angle));
            ball.y = paddle.y - ball.r - 0.5;
          }

          // 벽돌 충돌
          for (const b of bricks) {
            if (!b.alive) continue;
            if (rectsOverlap(ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2, b.x, b.y, b.w, b.h)) {
              b.alive = false;
              score += 10;
              // 공이 벽돌의 위/아래에서 왔는지 좌/우에서 왔는지를 겹친 깊이로 대략 판정
              const overlapX = Math.min(ball.x + ball.r - b.x, b.x + b.w - (ball.x - ball.r));
              const overlapY = Math.min(ball.y + ball.r - b.y, b.y + b.h - (ball.y - ball.r));
              if (overlapX < overlapY) ball.vx *= -1;
              else ball.vy *= -1;
              break;
            }
          }

          // 바닥으로 떨어지면 라이프 감소
          if (ball.y - ball.r > H) {
            lives--;
            if (lives <= 0) {
              gameState = 'gameover';
            } else {
              resetBall();
            }
          }

          if (bricks.every((b) => !b.alive)) gameState = 'win';
        }
      }

      // ---------- 그리기 ----------
      ctx.fillStyle = '#10121c';
      ctx.fillRect(0, 0, W, H);

      for (const b of bricks) {
        if (!b.alive) continue;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.w, b.h);
      }

      ctx.fillStyle = '#e8e9f0';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 5) : ctx.rect(paddle.x, paddle.y, paddle.w, paddle.h);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = '#5b6cff';
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#aaa';
      ctx.font = '13px -apple-system, sans-serif';
      ctx.fillText(`점수 ${score}`, 12, H - 10);
      ctx.fillText(`라이프 ${'♥'.repeat(Math.max(0, lives))}`, W - 90, H - 10);

      if (ball.stuck && gameState === 'playing') {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.textAlign = 'center';
        ctx.font = '14px -apple-system, sans-serif';
        ctx.fillText('Space 또는 클릭으로 발사', W / 2, H / 2);
        ctx.textAlign = 'left';
      }

      if (gameState !== 'playing') {
        ctx.fillStyle = 'rgba(10,11,18,0.65)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(gameState === 'win' ? '승리! 🎉' : '게임 오버', W / 2, H / 2 - 10);
        ctx.font = '14px -apple-system, sans-serif';
        ctx.fillText('Space 또는 클릭으로 다시 시작', W / 2, H / 2 + 20);
        ctx.textAlign = 'left';
      }
    });
  },
});
})();
