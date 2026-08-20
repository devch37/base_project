(function () {
/**
 * 08-path2d.js — Path2D 객체와 히트 테스트(isPointInPath)
 * ------------------------------------------------------------------
 *  - 지금까지는 ctx.beginPath()/moveTo()/lineTo() 로 "캔버스에 상태로 저장된" 경로를 썼지만,
 *    Path2D 를 쓰면 경로 자체를 독립적인 객체로 만들어 재사용/보관할 수 있습니다.
 *  - new Path2D(svgPathData) 처럼 SVG의 "d" 속성 문자열을 그대로 넣어 경로를 만들 수도 있습니다.
 *  - ctx.fill(path2d) / ctx.stroke(path2d) 처럼 어떤 경로를 그릴지 인자로 넘길 수 있습니다.
 *  - ctx.isPointInPath(path2d, x, y) : 특정 좌표가 그 경로 "안"에 있는지 판정
 *    → 클릭 가능한 도형(버튼, 지도의 국가 영역 등)을 만들 때 필수적인 히트 테스트 기법입니다.
 */
registerDemo({
  id: 'path2d',
  category: '2. 변형 & 합성',
  title: 'Path2D & 히트 테스트',
  desc: '경로를 객체로 재사용하는 Path2D 와 isPointInPath 를 이용한 클릭 판정',
  file: 'js/demos/08-path2d.js',
  points: [
    'Path2D 는 경로를 객체로 캡슐화해서 매번 다시 그리지 않고 재사용할 수 있게 해줍니다.',
    'new Path2D("M10 10 L90 10 L50 90 Z") 처럼 SVG path data 문자열로도 만들 수 있습니다.',
    'isPointInPath(path, x, y) 로 마우스 좌표가 도형 내부인지 판정해 hover/click 을 구현합니다.',
    'x,y 는 transform 에 영향받지 않는 "캔버스 원본 픽셀" 좌표라서, CSS 좌표를 devicePixelRatio 만큼 환산해야 합니다.',
    '도형이 많은 인터랙티브 캔버스(지도, 다이어그램)에서 DOM 없이도 클릭 영역을 관리할 수 있습니다.',
  ],
  init(ctx, canvas, helpers) {
    // ---------- Path2D 도형 3종 준비 ----------
    const heart = new Path2D();
    heart.moveTo(0, 15);
    heart.bezierCurveTo(0, 5, -10, -10, -25, -10);
    heart.bezierCurveTo(-45, -10, -45, 15, -45, 15);
    heart.bezierCurveTo(-45, 35, -25, 50, 0, 65);
    heart.bezierCurveTo(25, 50, 45, 35, 45, 15);
    heart.bezierCurveTo(45, 15, 45, -10, 25, -10);
    heart.bezierCurveTo(12, -10, 0, 5, 0, 15);

    // SVG path data 문자열로 만든 삼각형 배지 모양
    const badge = new Path2D('M50 0 L100 30 L82 100 L18 100 L0 30 Z');

    const gear = makeGearPath(0, 0, 34, 20, 8);

    const shapes = [
      { path: heart, x: 130, y: 90, color: '#ff6b6b', name: '하트 (커스텀 path)' },
      { path: badge, x: 320, y: 60, scale: 0.9, color: '#5b6cff', name: '배지 (SVG path data)' },
      { path: gear, x: 500, y: 150, color: '#20c997', name: '톱니바퀴 (계산된 다각형)' },
    ];

    let hoverIndex = -1;

    helpers.on(canvas, 'pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      // isPointInPath(path, x, y) 의 x,y 는 "CTM(transform)에 영향받지 않는 캔버스 원본 픽셀 좌표"
      // 를 기대합니다. 우리는 devicePixelRatio 대응을 위해 canvas.width 를 CSS 크기보다 크게 잡아뒀으므로
      // (fitCanvasToDisplaySize 참고), 마우스의 CSS 좌표를 캔버스 원본 픽셀 좌표로 환산해야 합니다.
      const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (canvas.height / rect.height);
      hoverIndex = -1;
      shapes.forEach((s, i) => {
        ctx.save();
        ctx.translate(s.x, s.y);
        if (s.scale) ctx.scale(s.scale, s.scale);
        // path 는 로컬 좌표 그대로 두고, isPointInPath 가 현재 CTM(translate/scale 등)을
        // 적용해 path를 원본 픽셀 공간으로 변환한 뒤 mx,my 와 비교하도록 맡깁니다.
        if (ctx.isPointInPath(s.path, mx, my)) hoverIndex = i;
        ctx.restore();
      });
      draw();
    });

    draw();

    function draw() {
      const w = helpers.width();
      const h = helpers.height();
      ctx.clearRect(0, 0, w, h);
      ctx.font = '12px -apple-system, sans-serif';

      shapes.forEach((s, i) => {
        ctx.save();
        ctx.translate(s.x, s.y);
        if (s.scale) ctx.scale(s.scale, s.scale);

        const hovered = i === hoverIndex;
        ctx.fillStyle = hovered ? '#ffd43b' : s.color;
        ctx.strokeStyle = '#1c1e26';
        ctx.lineWidth = hovered ? 3 : 1.5;
        ctx.fill(s.path); // ← Path2D 객체를 인자로 넘겨서 그림
        ctx.stroke(s.path);
        ctx.restore();

        ctx.fillStyle = '#555';
        ctx.textAlign = 'center';
        ctx.fillText(s.name + (hovered ? ' (hover 중!)' : ''), s.x, s.y + 90);
        ctx.textAlign = 'left';
      });
    }
  },
});

// 톱니바퀴 모양 Path2D 를 좌표 계산으로 생성
function makeGearPath(cx, cy, outerR, innerR, teeth) {
  const p = new Path2D();
  for (let i = 0; i < teeth * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI * i) / teeth;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    i === 0 ? p.moveTo(x, y) : p.lineTo(x, y);
  }
  p.closePath();
  return p;
}

})();
