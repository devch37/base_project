(function () {
/**
 * 22-double-pendulum.js — 이중 진자 (카오스 시뮬레이션)
 * ------------------------------------------------------------------
 * 진자 끝에 진자를 하나 더 매달면(이중 진자), 뉴턴 역학을 따르는 완전한
 * 결정론적 시스템인데도 아주 작은 시작 각도 차이가 시간이 지나면서 완전히
 * 다른 궤적으로 폭발적으로 벌어집니다 — 이것이 "카오스(chaos)"의 정의적 특징입니다.
 *
 *  - 두 링크의 각도(θ1,θ2)와 각속도(ω1,ω2)를 라그랑주 역학으로 유도된 미분방정식으로
 *    매 프레임 갱신합니다 (공식 자체는 복잡하지만, "각가속도를 구해서 적분한다"는
 *    원리는 여느 물리 시뮬레이션과 동일합니다).
 *  - 시작 각도가 0.001 라디안(사람 눈에 안 보이는 차이)만 다른 진자 두 개를 동시에
 *    그려서, 처음엔 겹쳐 보이다가 몇 초 뒤 완전히 다른 길을 가는 모습을 보여줍니다.
 *  - 두 번째 추가 궤적을 트레일로 남겨서 "나비 궤적" 같은 그림이 그려집니다.
 */
registerDemo({
  id: 'double-pendulum',
  category: '7. 물리 & 군집 시뮬레이션',
  title: '이중 진자 (카오스)',
  desc: '시작 각도가 0.001만 달라도 시간이 지나면 완전히 갈라지는 혼돈계 시뮬레이션',
  file: 'js/demos/22-double-pendulum.js',
  points: [
    '이중 진자의 운동방정식은 라그랑주 역학으로 유도되며, 매 프레임 각가속도를 적분해 갱신합니다.',
    '시작 각도가 극미하게(0.001rad) 다른 진자 두 개를 함께 그려 초기값 민감성을 눈으로 보여줍니다.',
    '적분이 불안정해지지 않도록 한 프레임을 여러 개의 작은 시간 단계(substep)로 나눠 계산합니다.',
    '진자 끝(2번 추)의 이동 경로를 트레일로 남겨 궤적 자체가 예술적인 그림이 되도록 했습니다.',
  ],
  init(ctx, canvas, helpers) {
    const G = 980; // 픽셀 스케일에 맞춘 중력 가속도
    const L1 = 110,
      L2 = 110;
    const M1 = 14,
      M2 = 14; // 반지름(질량 대용, 그림 크기에도 사용)

    function makePendulum(theta1) {
      return { theta1, theta2: Math.PI * 0.62, omega1: 0, omega2: 0, trail: [] };
    }
    let pA = makePendulum(Math.PI * 0.5);
    let pB = makePendulum(Math.PI * 0.5 + 0.001); // 시작 각도만 아주 살짝 다름
    let backgroundPainted = false;

    helpers.controls.innerHTML = `<button id="dp-reset">초기 각도로 리셋</button> <span style="color:var(--text-dim)">두 진자는 시작 각도가 0.001rad 만 다릅니다</span>`;
    helpers.on(document.getElementById('dp-reset'), 'click', () => {
      pA = makePendulum(Math.PI * 0.5);
      pB = makePendulum(Math.PI * 0.5 + 0.001);
      backgroundPainted = false;
    });

    function step(p, dt) {
      const { theta1, theta2, omega1, omega2 } = p;
      const num1 =
        -G * (2 * M1 + M2) * Math.sin(theta1) -
        M2 * G * Math.sin(theta1 - 2 * theta2) -
        2 * Math.sin(theta1 - theta2) * M2 * (omega2 * omega2 * L2 + omega1 * omega1 * L1 * Math.cos(theta1 - theta2));
      const den1 = L1 * (2 * M1 + M2 - M2 * Math.cos(2 * theta1 - 2 * theta2));
      const alpha1 = num1 / den1;

      const num2 =
        2 *
        Math.sin(theta1 - theta2) *
        (omega1 * omega1 * L1 * (M1 + M2) + G * (M1 + M2) * Math.cos(theta1) + omega2 * omega2 * L2 * M2 * Math.cos(theta1 - theta2));
      const den2 = L2 * (2 * M1 + M2 - M2 * Math.cos(2 * theta1 - 2 * theta2));
      const alpha2 = num2 / den2;

      p.omega1 += alpha1 * dt;
      p.omega2 += alpha2 * dt;
      p.theta1 += p.omega1 * dt;
      p.theta2 += p.omega2 * dt;
    }

    function positions(p, originX, originY) {
      const x1 = originX + L1 * Math.sin(p.theta1);
      const y1 = originY + L1 * Math.cos(p.theta1);
      const x2 = x1 + L2 * Math.sin(p.theta2);
      const y2 = y1 + L2 * Math.cos(p.theta2);
      return { x1, y1, x2, y2 };
    }

    helpers.loop(() => {
      const w = helpers.width();
      const h = helpers.height();
      const originX = w / 2;
      const originY = h * 0.28;

      // 물리 안정성을 위해 한 프레임(≈16ms)을 여러 개의 작은 스텝으로 나눠 적분
      for (let i = 0; i < 6; i++) {
        step(pA, 1 / 6 / 60);
        step(pB, 1 / 6 / 60);
      }

      if (!backgroundPainted) {
        ctx.fillStyle = '#0b0c14';
        ctx.fillRect(0, 0, w, h);
        backgroundPainted = true;
      }
      ctx.fillStyle = 'rgba(11, 12, 20, 0.12)';
      ctx.fillRect(0, 0, w, h);

      const posA = positions(pA, originX, originY);
      const posB = positions(pB, originX, originY);

      pA.trail.push(posA);
      pB.trail.push(posB);
      if (pA.trail.length > 400) pA.trail.shift();
      if (pB.trail.length > 400) pB.trail.shift();

      drawTrail(pA.trail, '#5b9bff');
      drawTrail(pB.trail, '#ff6b8b');
      drawRig(originX, originY, posA, 'rgba(120,170,255,0.9)');
      drawRig(originX, originY, posB, 'rgba(255,120,150,0.9)');

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.fillText('파란 진자와 분홍 진자는 시작 각도가 0.001rad 차이입니다', 14, 20);
    });

    function drawTrail(trail, color) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1.5;
      for (let i = 1; i < trail.length; i++) {
        ctx.moveTo(trail[i - 1].x2, trail[i - 1].y2);
        ctx.lineTo(trail[i].x2, trail[i].y2);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    function drawRig(ox, oy, pos, color) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(pos.x1, pos.y1);
      ctx.lineTo(pos.x2, pos.y2);
      ctx.stroke();

      ctx.fillStyle = color;
      [
        [ox, oy, 4],
        [pos.x1, pos.y1, M1],
        [pos.x2, pos.y2, M2],
      ].forEach(([x, y, r]) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  },
});
})();
