(function () {
/**
 * 14-particles.js — 파티클 시스템
 * ------------------------------------------------------------------
 * 파티클 시스템은 "작은 오브젝트를 수백 개 관리하는 배열 + 매 프레임 물리 업데이트"
 * 라는 아주 일반적인 패턴입니다. 불꽃, 연기, 폭발, 별가루 효과 등에 널리 쓰입니다.
 *
 *  - 각 파티클은 {x, y, vx, vy, life, ...} 같은 상태를 갖는 순수한 JS 객체입니다.
 *    (DOM 요소가 아니라 "데이터"이고, Canvas 는 그 데이터를 매 프레임 그림으로 그려줄 뿐입니다)
 *  - 매 프레임: 위치를 속도만큼 이동 → 중력/마찰 등 힘을 속도에 반영 → 수명(life)을 감소
 *    → 수명이 다한 파티클은 배열에서 제거(또는 재활용)합니다.
 *  - 마우스 근처의 파티클에 반발력을 주면 인터랙티브한 "밀어내기" 효과를 만들 수 있습니다.
 */
registerDemo({
  id: 'particles',
  category: '4. 인터랙션 & 애니메이션',
  title: '파티클 시스템',
  desc: '수백 개의 파티클 객체를 배열로 관리하며 중력/마찰/수명을 매 프레임 갱신',
  file: 'js/demos/14-particles.js',
  points: [
    '파티클 = {x,y,vx,vy,life} 같은 상태를 가진 평범한 객체이고, 배열로 여러 개를 관리합니다.',
    '매 프레임 "이동 → 힘(중력/마찰) 적용 → 수명 감소 → 죽은 파티클 제거" 순서로 갱신합니다.',
    '클릭하면 그 위치에서 새 파티클 무더기를 "폭발"시키듯 생성합니다.',
    '마우스 커서 주변 파티클에는 거리 기반 반발력을 주어 인터랙티브하게 반응시킵니다.',
  ],
  init(ctx, canvas, helpers) {
    let particles = [];
    const mouse = { x: -999, y: -999, down: false };

    function spawnBurst(x, y, count = 40) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1, // 1(생) → 0(소멸) 로 줄어드는 수명 비율
          decay: 0.008 + Math.random() * 0.012,
          size: 2 + Math.random() * 3,
          hue: 220 + Math.random() * 120,
        });
      }
    }

    // 초기 파티클 무리를 화면 중앙에서 한 번 터뜨려 둠
    helpers.onCleanup(() => (particles = []));

    helpers.on(canvas, 'pointerdown', (e) => {
      mouse.down = true;
      const p = toPos(e);
      spawnBurst(p.x, p.y, 60);
    });
    helpers.on(canvas, 'pointerup', () => (mouse.down = false));
    helpers.on(canvas, 'pointermove', (e) => {
      const p = toPos(e);
      mouse.x = p.x;
      mouse.y = p.y;
      if (mouse.down) spawnBurst(p.x, p.y, 4); // 누른 채로 움직이면 계속 생성 (붓처럼)
    });

    function toPos(e) {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    let tick = 0;
    helpers.loop(() => {
      tick++;
      const w = helpers.width();
      const h = helpers.height();

      // 잔상 효과: 완전히 지우지 않고 반투명 검정을 덮어서 트레일(꼬리)이 남게 함
      ctx.fillStyle = 'rgba(15, 17, 26, 0.18)';
      ctx.fillRect(0, 0, w, h);

      // 자동으로 파티클이 계속 솟아나는 "분수" 효과 (하단 중앙)
      if (tick % 2 === 0) {
        particles.push({
          x: w / 2 + (Math.random() - 0.5) * 40,
          y: h - 10,
          vx: (Math.random() - 0.5) * 2,
          vy: -6 - Math.random() * 3,
          life: 1,
          decay: 0.006 + Math.random() * 0.01,
          size: 2 + Math.random() * 2.5,
          hue: 340 + Math.random() * 60,
        });
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // 1) 물리 업데이트: 중력 + 마찰
        p.vy += 0.06; // 중력: 아래로 갈수록 가속
        p.vx *= 0.995; // 공기 저항으로 서서히 감속
        p.vy *= 0.995;

        // 2) 마우스 근처면 반발력을 줌 (거리가 가까울수록 세게 밀림)
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 80) {
          const force = (80 - dist) / 80;
          p.vx += (dx / (dist || 1)) * force * 1.2;
          p.vy += (dy / (dist || 1)) * force * 1.2;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        // 3) 수명이 다했거나 화면 밖으로 나갔으면 제거
        if (p.life <= 0 || p.y > h + 40) {
          particles.splice(i, 1);
          continue;
        }

        // 4) 그리기: life 를 그대로 투명도로 사용해 사라지는 느낌을 줌
        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${p.life})`;
        ctx.arc(p.x, p.y, p.size * p.life + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (particles.length > 1500) particles.splice(0, particles.length - 1500); // 안전장치

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.fillText(`파티클 수: ${particles.length}  (클릭/드래그로 폭발시켜보세요)`, 14, 22);
    });
  },
});

})();
