(function () {
/**
 * 21-boids.js — Boids 플로킹(무리 짓기) 시뮬레이션
 * ------------------------------------------------------------------
 * 새 한 마리(boid)는 아주 단순한 3가지 규칙만 따르는데, 수백 마리가 모이면
 * 마치 지능이 있는 것처럼 자연스러운 새떼/물고기떼 무리 행동이 나타납니다
 * (Craig Reynolds, 1986 — "Boids" 알고리즘).
 *
 *  1) 분리(Separation): 너무 가까운 이웃과는 서로 부딪히지 않게 멀어지려 한다.
 *  2) 정렬(Alignment): 주변 이웃들이 향하는 평균 방향으로 나도 방향을 맞춘다.
 *  3) 응집(Cohesion): 주변 이웃들의 평균 위치(무리의 중심) 쪽으로 살짝 끌린다.
 *
 * 세 규칙 모두 "steering = desired velocity − 현재 velocity" 형태의 조향력으로
 * 계산합니다. 원하는 방향을 구한 뒤 크기를 maxSpeed로 정규화하고, 현재 속도와의
 * 차이(steering)를 다시 maxForce 로 제한합니다. 이렇게 모든 힘의 크기를
 * 정규화해서 합산해야 규칙끼리 크기 스케일이 달라 한쪽으로 폭주하지 않고
 * 안정적으로 흩어져 흐르는 무리 행동이 나옵니다.
 */
registerDemo({
  id: 'boids',
  category: '7. 물리 & 군집 시뮬레이션',
  title: 'Boids 플로킹 시뮬레이션',
  desc: '분리·정렬·응집 세 가지 단순 규칙만으로 만들어지는 새떼 무리 행동',
  file: 'js/demos/21-boids.js',
  points: [
    '분리(Separation): 가까운 이웃과 겹치지 않도록 멀어지는 힘입니다.',
    '정렬(Alignment): 주변 이웃들의 평균 진행 방향으로 맞추는 힘입니다.',
    '응집(Cohesion): 주변 이웃들의 무게중심 쪽으로 끌리는 힘입니다.',
    '세 힘 모두 "원하는 속도 − 현재 속도" 형태로 정규화해 크기를 맞춘 뒤 합산해야 안정적입니다.',
    '클릭한 지점은 잠시 "포식자"가 되어 근처 보이드들이 흩어져 도망칩니다.',
  ],
  init(ctx, canvas, helpers) {
    const state = { count: 140, perception: 55, maxSpeed: 3.2, maxForce: 0.11 };
    const SEPARATION_RADIUS = 26; // 분리는 정렬/응집보다 훨씬 좁은 반경에서만 작동해야 흩어져 보입니다
    let boids = [];
    let predator = null; // {x,y} 또는 null
    let backgroundPainted = false;

    helpers.controls.innerHTML = `
      <label>개체 수 <input id="bd-count" type="range" min="30" max="300" step="10" value="140" /></label>
      <label>인지 반경 <input id="bd-perc" type="range" min="20" max="100" value="55" /></label>
      <button id="bd-reset">다시 뿌리기</button>
    `;
    const countEl = document.getElementById('bd-count');
    const percEl = document.getElementById('bd-perc');
    helpers.on(countEl, 'input', () => spawn(Number(countEl.value)));
    helpers.on(percEl, 'input', () => (state.perception = Number(percEl.value)));
    helpers.on(document.getElementById('bd-reset'), 'click', () => spawn(state.count));

    function spawn(n) {
      state.count = n;
      const w = helpers.width();
      const h = helpers.height();
      boids = Array.from({ length: n }, () => {
        const angle = Math.random() * Math.PI * 2;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: Math.cos(angle) * state.maxSpeed * 0.6,
          vy: Math.sin(angle) * state.maxSpeed * 0.6,
          hue: Math.random() * 60 + 190, // 개체마다 고유 색상(청록~보라)을 유지
        };
      });
    }
    spawn(state.count);

    helpers.on(canvas, 'pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      predator = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    });
    helpers.on(canvas, 'pointermove', (e) => {
      if (!predator) return;
      const rect = canvas.getBoundingClientRect();
      predator = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    });
    helpers.on(canvas, 'pointerup', () => (predator = null));
    helpers.on(canvas, 'pointerleave', () => (predator = null));

    // ---------- 벡터 도우미 ----------
    function mag(v) {
      return Math.hypot(v.x, v.y);
    }
    function setMag(v, m) {
      const len = mag(v) || 1;
      return { x: (v.x / len) * m, y: (v.y / len) * m };
    }
    function limit(v, max) {
      const len = mag(v);
      return len > max ? setMag(v, max) : v;
    }

    // 세 규칙을 "원하는 속도(desired) − 현재 속도(velocity)" 조향력으로 계산합니다.
    function computeSteering(b, boids) {
      let sepSum = { x: 0, y: 0 },
        sepCount = 0;
      let aliSum = { x: 0, y: 0 },
        aliCount = 0;
      let cohSum = { x: 0, y: 0 },
        cohCount = 0;

      for (const other of boids) {
        if (other === b) continue;
        const dx = b.x - other.x;
        const dy = b.y - other.y;
        const dist = Math.hypot(dx, dy);
        if (dist === 0) continue;

        if (dist < SEPARATION_RADIUS) {
          // 가까울수록(1/dist) 더 강하게 밀어내는 방향의 단위 벡터를 누적
          sepSum.x += (dx / dist) / dist;
          sepSum.y += (dy / dist) / dist;
          sepCount++;
        }
        if (dist < state.perception) {
          aliSum.x += other.vx;
          aliSum.y += other.vy;
          aliCount++;
          cohSum.x += other.x;
          cohSum.y += other.y;
          cohCount++;
        }
      }

      let separation = { x: 0, y: 0 };
      if (sepCount > 0) {
        separation = setMag(sepSum, state.maxSpeed);
        separation = limit({ x: separation.x - b.vx, y: separation.y - b.vy }, state.maxForce);
      }

      let alignment = { x: 0, y: 0 };
      if (aliCount > 0) {
        const avgVel = { x: aliSum.x / aliCount, y: aliSum.y / aliCount };
        const desired = setMag(avgVel, state.maxSpeed);
        alignment = limit({ x: desired.x - b.vx, y: desired.y - b.vy }, state.maxForce);
      }

      let cohesion = { x: 0, y: 0 };
      if (cohCount > 0) {
        const center = { x: cohSum.x / cohCount, y: cohSum.y / cohCount };
        const toCenter = { x: center.x - b.x, y: center.y - b.y };
        const desired = setMag(toCenter, state.maxSpeed);
        cohesion = limit({ x: desired.x - b.vx, y: desired.y - b.vy }, state.maxForce);
      }

      return { separation, alignment, cohesion };
    }

    helpers.loop(() => {
      const w = helpers.width();
      const h = helpers.height();
      if (!backgroundPainted) {
        ctx.fillStyle = '#090a13';
        ctx.fillRect(0, 0, w, h);
        backgroundPainted = true;
      }
      ctx.fillStyle = 'rgba(9, 10, 19, 0.35)'; // 옅은 잔상으로 이동 궤적이 살짝 남게 함
      ctx.fillRect(0, 0, w, h);

      for (const b of boids) {
        const { separation, alignment, cohesion } = computeSteering(b, boids);

        // 세 조향력을 가중치로 합산해 가속도로 사용 (모두 이미 maxForce로 크기가 맞춰져 있음)
        b.vx += separation.x * 1.7 + alignment.x * 1.0 + cohesion.x * 1.0;
        b.vy += separation.y * 1.7 + alignment.y * 1.0 + cohesion.y * 1.0;

        // 포식자(마우스 클릭)에게서는 강하게 도망침
        if (predator) {
          const dx = b.x - predator.x;
          const dy = b.y - predator.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 110 && dist > 0) {
            b.vx += (dx / dist) * 0.6;
            b.vy += (dy / dist) * 0.6;
          }
        }

        const clamped = limit({ x: b.vx, y: b.vy }, state.maxSpeed);
        b.vx = clamped.x;
        b.vy = clamped.y;
        b.x += b.vx;
        b.y += b.vy;

        // 화면 가장자리는 반대편으로 순환(wrap)
        if (b.x < -10) b.x = w + 10;
        if (b.x > w + 10) b.x = -10;
        if (b.y < -10) b.y = h + 10;
        if (b.y > h + 10) b.y = -10;
      }

      // 그리기: 진행 방향을 향하는 작은 삼각형 (lighter 합성으로 겹칠 때 은은하게 빛남)
      ctx.globalCompositeOperation = 'lighter';
      for (const b of boids) {
        const angle = Math.atan2(b.vy, b.vx);
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(9, 0);
        ctx.lineTo(-6, 4);
        ctx.lineTo(-6, -4);
        ctx.closePath();
        ctx.fillStyle = `hsl(${b.hue}, 90%, 65%)`;
        ctx.fill();
        ctx.restore();
      }
      ctx.globalCompositeOperation = 'source-over';

      if (predator) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,90,90,0.6)';
        ctx.lineWidth = 2;
        ctx.arc(predator.x, predator.y, 110, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = '#888';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.fillText(`${boids.length}마리 — 클릭/드래그로 포식자가 되어보세요`, 14, h - 14);
    });
  },
});
})();
