(function () {
/**
 * 15-bouncing-balls.js — 물리 애니메이션과 충돌 감지
 * ------------------------------------------------------------------
 * 파티클 데모보다 한 단계 더 나아가, "물체 간의 충돌"까지 감지하는 예제입니다.
 *
 *  - 벽 충돌: 공의 중심이 반지름만큼 벽에 가까워지면 해당 축의 속도 부호를 뒤집습니다
 *    (x축 벽이면 vx *= -1, y축 벽이면 vy *= -1) → 이것이 "반사(reflection)"의 기본 원리입니다.
 *  - 공-공 충돌: 두 공의 중심 거리가 (반지름의 합)보다 작아지면 겹친 것으로 판정하고,
 *    간단화를 위해 서로의 속도를 교환(elastic collision 근사)합니다.
 *  - requestAnimationFrame 루프 안에서 매 프레임 "이동 → 충돌 검사 → 반응" 을 반복합니다.
 */
registerDemo({
  id: 'bouncing-balls',
  category: '4. 인터랙션 & 애니메이션',
  title: '튕기는 공 (충돌 감지)',
  desc: '벽 반사와 공-공 충돌 판정을 매 프레임 계산하는 간단한 물리 시뮬레이션',
  file: 'js/demos/15-bouncing-balls.js',
  points: [
    '벽 충돌은 "공이 벽을 넘으려는 순간 해당 축의 속도 부호를 뒤집는" 방식으로 구현합니다.',
    '공-공 충돌은 두 중심 사이 거리가 반지름의 합보다 작은지로 판정합니다 (원-원 충돌).',
    '충돌 시 두 공의 속도를 서로 교환해 탄성 충돌을 단순하게 흉내냅니다.',
    '슬라이더로 공의 개수를 바꾸면 매번 새로운 초기 상태로 시뮬레이션을 재시작합니다.',
  ],
  init(ctx, canvas, helpers) {
    let balls = [];
    const state = { gravity: true };

    helpers.controls.innerHTML = `
      <label>공 개수 <input id="b-count" type="range" min="4" max="60" value="20" /></label>
      <label>중력 <input id="b-gravity" type="checkbox" checked /></label>
      <button id="b-reset">다시 뿌리기</button>
    `;
    const countInput = document.getElementById('b-count');
    const gravityInput = document.getElementById('b-gravity');
    const resetBtn = document.getElementById('b-reset');

    function spawn() {
      const w = helpers.width();
      const h = helpers.height();
      const n = Number(countInput.value);
      balls = [];
      for (let i = 0; i < n; i++) {
        const r = 10 + Math.random() * 16;
        balls.push({
          x: r + Math.random() * (w - r * 2),
          y: r + Math.random() * (h / 2),
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 4,
          r,
          hue: Math.random() * 360,
        });
      }
    }

    helpers.on(countInput, 'input', spawn);
    helpers.on(gravityInput, 'change', () => (state.gravity = gravityInput.checked));
    helpers.on(resetBtn, 'click', spawn);
    spawn();

    helpers.loop(() => {
      const w = helpers.width();
      const h = helpers.height();
      ctx.clearRect(0, 0, w, h);

      // ---------- 1) 이동 + 힘 적용 ----------
      for (const b of balls) {
        if (state.gravity) b.vy += 0.25; // 중력
        b.vx *= 0.999;
        b.vy *= 0.999;
        b.x += b.vx;
        b.y += b.vy;

        // ---------- 2) 벽 충돌: 반지름만큼 파고들면 속도 반전 + 위치 보정 ----------
        if (b.x - b.r < 0) {
          b.x = b.r;
          b.vx *= -0.92; // 살짝 에너지를 잃도록(반발계수 0.92)
        } else if (b.x + b.r > w) {
          b.x = w - b.r;
          b.vx *= -0.92;
        }
        if (b.y - b.r < 0) {
          b.y = b.r;
          b.vy *= -0.92;
        } else if (b.y + b.r > h) {
          b.y = h - b.r;
          b.vy *= -0.92;
          if (Math.abs(b.vy) < 0.6) b.vy = 0; // 미세한 떨림 방지
        }
      }

      // ---------- 3) 공-공 충돌 판정 (모든 쌍을 비교, O(n^2)) ----------
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const a = balls[i];
          const b = balls[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy);
          const minDist = a.r + b.r;

          if (dist < minDist && dist > 0) {
            // 겹친 만큼 서로 반대 방향으로 밀어내서 위치를 보정(overlap resolution)
            const overlap = (minDist - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;
            a.x -= nx * overlap;
            a.y -= ny * overlap;
            b.x += nx * overlap;
            b.y += ny * overlap;

            // 단순화된 탄성 충돌: 두 공의 속도를 서로 교환
            const tempVx = a.vx,
              tempVy = a.vy;
            a.vx = b.vx;
            a.vy = b.vy;
            b.vx = tempVx;
            b.vy = tempVy;
          }
        }
      }

      // ---------- 4) 그리기 ----------
      for (const b of balls) {
        ctx.beginPath();
        ctx.fillStyle = `hsl(${b.hue}, 75%, 60%)`;
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.stroke();
      }

      ctx.fillStyle = '#888';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.fillText(`공 ${balls.length}개 — 벽 반사 + 공-공 충돌 판정 중`, 14, h - 14);
    });
  },
});

})();
