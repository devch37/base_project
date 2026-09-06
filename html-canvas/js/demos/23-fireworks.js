(function () {
/**
 * 23-fireworks.js — 불꽃놀이 (로켓 발사 + 폭발 파티클)
 * ------------------------------------------------------------------
 * 14-particles.js 의 파티클 시스템을 한 단계 확장한 예제입니다.
 *
 *  - "로켓" 은 위로 쏘아 올려지는 하나의 점입니다. 정점(더 이상 못 올라가고
 *    아래로 떨어지기 시작하는 순간, 즉 vy가 음수→양수로 바뀌는 시점)에 도달하면
 *    "폭발"해서 수십 개의 파티클을 사방으로 흩뿌립니다.
 *  - 폭발한 파티클들은 중력을 받아 아래로 떨어지며 서서히 사라집니다(life 감소).
 *  - globalCompositeOperation='lighter' (덧셈 합성)로 그려서 파티클이 겹칠 때
 *    실제 불꽃놀이처럼 밝게 빛나 보이게 했습니다.
 *  - 클릭한 위치로 로켓을 쏘아 올릴 수 있고, 꺼두지 않으면 자동으로도 계속 발사됩니다.
 */
registerDemo({
  id: 'fireworks',
  category: '7. 물리 & 군집 시뮬레이션',
  title: '불꽃놀이',
  desc: '로켓 발사 → 정점에서 폭발 → 중력 파티클, lighter 합성으로 빛나는 불꽃놀이',
  file: 'js/demos/23-fireworks.js',
  points: [
    '로켓은 위로 발사되다가 상승 속도(vy)가 0을 넘기는 "정점"에서 폭발 이벤트를 일으킵니다.',
    '폭발은 랜덤한 각도/속도로 수십 개의 파티클을 만드는 것으로 구현됩니다 (14-particles.js 참고).',
    "lighter 합성 모드로 겹치는 파티클끼리 밝기가 더해져 실제 폭죽처럼 빛나 보입니다.",
    '클릭한 x 좌표로 로켓을 발사할 수 있고, 자동 발사도 함께 동작합니다.',
  ],
  init(ctx, canvas, helpers) {
    const state = { auto: true, density: 90 };
    let rockets = [];
    let sparks = [];
    let backgroundPainted = false;
    let autoTimer = 0;

    helpers.controls.innerHTML = `
      <label>자동 발사 <input id="fw-auto" type="checkbox" checked /></label>
      <label>폭발 밀도 <input id="fw-density" type="range" min="30" max="150" step="10" value="90" /></label>
      <span style="color:var(--text-dim)">캔버스를 클릭하면 그 위치로 로켓을 쏩니다</span>
    `;
    helpers.on(document.getElementById('fw-auto'), 'change', (e) => (state.auto = e.target.checked));
    helpers.on(document.getElementById('fw-density'), 'input', (e) => (state.density = Number(e.target.value)));

    function launch(x, h) {
      const targetY = 40 + Math.random() * (h * 0.45);
      rockets.push({
        x,
        y: h,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(Math.sqrt((h - targetY) * 2 * 0.14) + 2), // 목표 높이까지 도달할 초기 속도 역산
        hue: Math.random() * 360,
        trail: [],
      });
    }

    helpers.on(canvas, 'pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      launch(e.clientX - rect.left, helpers.height());
    });

    function explode(x, y, hue) {
      const n = state.density;
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n + Math.random() * 0.2;
        const speed = 1.5 + Math.random() * 4.5;
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          hue: hue + (Math.random() - 0.5) * 40,
          life: 1,
          decay: 0.008 + Math.random() * 0.014,
          flicker: Math.random() * Math.PI * 2,
        });
      }
    }

    helpers.loop((t) => {
      const w = helpers.width();
      const h = helpers.height();

      if (!backgroundPainted) {
        ctx.fillStyle = '#05060c';
        ctx.fillRect(0, 0, w, h);
        backgroundPainted = true;
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(5, 6, 12, 0.22)';
      ctx.fillRect(0, 0, w, h);

      if (state.auto) {
        autoTimer--;
        if (autoTimer <= 0 && rockets.length < 4) {
          launch(60 + Math.random() * (w - 120), h);
          autoTimer = 45 + Math.random() * 45;
        }
      }

      // ---------- 로켓 갱신 ----------
      ctx.globalCompositeOperation = 'lighter';
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.vy += 0.045; // 중력
        r.x += r.vx;
        r.y += r.vy;
        r.trail.push({ x: r.x, y: r.y });
        if (r.trail.length > 12) r.trail.shift();

        ctx.strokeStyle = `hsla(${r.hue}, 90%, 70%, 0.8)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        r.trail.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.stroke();

        if (r.vy >= 0) {
          // 상승이 멈추고 낙하로 전환되는 정점 = 폭발 시점
          explode(r.x, r.y, r.hue);
          rockets.splice(i, 1);
        }
      }

      // ---------- 폭발 파티클(스파크) 갱신 ----------
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.vy += 0.05; // 중력
        s.vx *= 0.985; // 공기 저항
        s.vy *= 0.985;
        s.x += s.vx;
        s.y += s.vy;
        s.life -= s.decay;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        const twinkle = 0.6 + Math.sin(t * 0.02 + s.flicker) * 0.4;
        const alpha = s.life * twinkle;
        // 부드러운 후광(halo) + 밝은 중심 코어를 겹쳐 그려 훨씬 화사하게 빛나 보이게 함
        ctx.beginPath();
        ctx.fillStyle = `hsla(${s.hue}, 95%, 65%, ${alpha * 0.35})`;
        ctx.arc(s.x, s.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = `hsla(${s.hue}, 100%, 80%, ${alpha})`;
        ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.fillText(`로켓 ${rockets.length} / 스파크 ${sparks.length}`, 14, 20);
    });
  },
});
})();
