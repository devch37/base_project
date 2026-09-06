(function () {
/**
 * 20-flow-field.js — Flow Field 파티클 (유체처럼 흐르는 애니메이션)
 * ------------------------------------------------------------------
 * 화면 전체에 "보이지 않는 바람 지도(벡터 필드)"를 깔아두고, 수백 개의 파티클이
 * 자기가 서 있는 위치의 바람 방향을 따라 흘러가게 하면 마치 유체나 은하수처럼
 * 보이는 유기적인 애니메이션이 만들어집니다. (Perlin/Simplex 노이즈 대신, 여러 개의
 * sin/cos 파동을 겹쳐서 비슷하게 매끄러운 "의사 노이즈" 필드를 만들었습니다)
 *
 *  - fieldAngle(x, y, t) : 좌표 (x,y)와 시간 t 를 받아 그 지점의 "바람 방향(각도)"을 반환합니다.
 *  - 각 파티클은 자기 위치의 각도만큼 아주 조금씩 이동하고, 지나온 경로를 얇은 선으로 남깁니다.
 *  - globalCompositeOperation='lighter' 로 겹치는 선이 서로 밝기를 더해 네온처럼 빛나 보입니다.
 *  - 매 프레임 배경을 완전히 지우지 않고 반투명 검정을 살짝 덮어 "잔상(트레일)"을 남깁니다.
 */
registerDemo({
  id: 'flow-field',
  category: '7. 물리 & 군집 시뮬레이션',
  title: 'Flow Field 파티클',
  desc: '의사 노이즈로 만든 벡터 필드를 따라 흐르는 수백 개의 파티클 (lighter 합성으로 네온 효과)',
  file: 'js/demos/20-flow-field.js',
  points: [
    '좌표마다 sin/cos 파동을 겹쳐 "방향(각도)"을 정의하는 벡터 필드를 만듭니다.',
    '파티클은 자기 위치의 필드 각도 방향으로 아주 조금씩 이동하며 경로를 남깁니다.',
    "globalCompositeOperation='lighter' 로 겹치는 선분끼리 색이 더해져 발광 효과가 납니다.",
    '"필드 보기" 를 켜면 실제 벡터 방향을 화살표 그리드로 시각화해서 원리를 확인할 수 있습니다.',
  ],
  init(ctx, canvas, helpers) {
    const state = { count: 700, speed: 1.6, showField: false };
    let particles = [];
    let backgroundPainted = false;

    helpers.controls.innerHTML = `
      <label>파티클 수 <input id="ff-count" type="range" min="100" max="1500" step="50" value="700" /></label>
      <label>속도 <input id="ff-speed" type="range" min="0.5" max="4" step="0.1" value="1.6" /></label>
      <label>필드 보기 <input id="ff-field" type="checkbox" /></label>
      <button id="ff-clear">지우기</button>
    `;
    const countEl = document.getElementById('ff-count');
    const speedEl = document.getElementById('ff-speed');
    const fieldEl = document.getElementById('ff-field');
    helpers.on(countEl, 'input', () => resizeParticles(Number(countEl.value)));
    helpers.on(speedEl, 'input', () => (state.speed = Number(speedEl.value)));
    helpers.on(fieldEl, 'change', () => (state.showField = fieldEl.checked));
    helpers.on(document.getElementById('ff-clear'), 'click', () => {
      ctx.fillStyle = '#07080f';
      ctx.fillRect(0, 0, helpers.width(), helpers.height());
    });

    function fieldAngle(x, y, t) {
      return (
        Math.sin(x * 0.006 + t * 0.35) * 1.4 +
        Math.cos(y * 0.007 - t * 0.25) * 1.4 +
        Math.sin((x + y) * 0.003 + t * 0.15) * 2
      );
    }

    function makeParticle(w, h) {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        hue: Math.random() * 60 + 180, // 청록~보라 계열
        life: Math.random() * 200 + 100,
      };
    }

    function resizeParticles(n) {
      state.count = n;
      const w = helpers.width();
      const h = helpers.height();
      if (particles.length < n) {
        while (particles.length < n) particles.push(makeParticle(w, h));
      } else {
        particles.length = n;
      }
    }
    resizeParticles(state.count);

    helpers.loop((t) => {
      const w = helpers.width();
      const h = helpers.height();
      const time = t / 1000;

      if (!backgroundPainted) {
        ctx.fillStyle = '#07080f';
        ctx.fillRect(0, 0, w, h);
        backgroundPainted = true;
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(7, 8, 15, 0.08)';
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = 'lighter'; // 겹치는 선분이 서로 밝기를 더함 (네온 느낌)
      ctx.lineWidth = 1.1;

      for (const p of particles) {
        const angle = fieldAngle(p.x, p.y, time);
        const nx = p.x + Math.cos(angle) * state.speed;
        const ny = p.y + Math.sin(angle) * state.speed;

        ctx.strokeStyle = `hsla(${p.hue}, 90%, 65%, 0.5)`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nx, ny);
        ctx.stroke();

        p.x = nx;
        p.y = ny;
        p.life--;

        // 수명이 다했거나 화면 밖으로 나가면 새 위치에서 다시 태어남
        if (p.life <= 0 || p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
          Object.assign(p, makeParticle(w, h));
        }
      }

      ctx.globalCompositeOperation = 'source-over';

      if (state.showField) {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        const step = 40;
        for (let y = step / 2; y < h; y += step) {
          for (let x = step / 2; x < w; x += step) {
            const a = fieldAngle(x, y, time);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14);
            ctx.stroke();
          }
        }
      }

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.fillText(`파티클 ${particles.length}개`, 14, 20);
    });
  },
});
})();
