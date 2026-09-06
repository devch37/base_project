(function () {
/**
 * 24-cube3d.js — 3D 큐브 (직접 구현한 원근 투영 + 화면 회전)
 * ------------------------------------------------------------------
 * Canvas 2D API 자체에는 3D 기능이 없지만, "3D 좌표를 회전시킨 뒤 2D 화면
 * 좌표로 투영(projection)하는 수학"만 직접 구현하면 2D 캔버스만으로도
 * 회전하는 입체 도형을 그릴 수 있습니다.
 *
 *  - 정육면체의 8개 꼭짓점을 3D 좌표 (x,y,z) 로 정의합니다.
 *  - 매 프레임 X축/Y축 회전 행렬을 곱해 꼭짓점들을 회전시킵니다.
 *  - 원근 투영: screenX = cx + x·f/(z+f) 공식으로, 카메라에서 먼(z가 큰) 점일수록
 *    화면 중앙에 더 가깝게(작게) 투영되어 "멀어질수록 작아 보이는" 원근감을 만듭니다.
 *  - 화가 알고리즘(Painter's algorithm): 6개 면을 카메라에서 먼 순서로 정렬해
 *    먼 면부터 그리면, 가까운 면이 자연스럽게 위에 덮여 그려집니다.
 *  - 각 면의 밝기는 광원 벡터와 면의 법선벡터를 내적해 계산합니다 (단순 flat shading).
 */
registerDemo({
  id: 'cube3d',
  category: '8. 3D & 게임',
  title: '3D 큐브 (수동 원근 투영)',
  desc: '회전 행렬 + 원근 투영 공식을 직접 구현해 2D 캔버스에 입체 큐브를 그리는 예제',
  file: 'js/demos/24-cube3d.js',
  points: [
    '3D 꼭짓점에 회전 행렬(rotateX, rotateY)을 곱해 매 프레임 회전시킵니다.',
    'screenX = cx + x·f/(z+f) 원근 공식으로 멀리 있는 점을 작게 투영합니다.',
    '화가 알고리즘: 면을 카메라에서 먼 순서로 정렬해 그리면 자연스럽게 앞면이 덮어 그려집니다.',
    '면의 법선과 광원 방향을 내적(dot product)해 단순한 명암(flat shading)을 계산합니다.',
  ],
  init(ctx, canvas, helpers) {
    const S = 90;
    const verts = [
      [-S, -S, -S],
      [S, -S, -S],
      [S, S, -S],
      [-S, S, -S],
      [-S, -S, S],
      [S, -S, S],
      [S, S, S],
      [-S, S, S],
    ];
    const faces = [
      { idx: [0, 1, 2, 3], color: [255, 99, 99] }, // front
      { idx: [5, 4, 7, 6], color: [255, 190, 90] }, // back
      { idx: [4, 0, 3, 7], color: [110, 220, 150] }, // left
      { idx: [1, 5, 6, 2], color: [100, 150, 255] }, // right
      { idx: [4, 5, 1, 0], color: [255, 225, 100] }, // top
      { idx: [3, 2, 6, 7], color: [190, 130, 255] }, // bottom
    ];

    let rotX = 0.5,
      rotY = 0.6;
    let velX = 0,
      velY = 0.006; // 관성 회전 속도 (유휴 상태일 때 천천히 자동 회전)
    let dragging = false;
    let lastPos = null;

    helpers.on(canvas, 'pointerdown', (e) => {
      dragging = true;
      lastPos = { x: e.clientX, y: e.clientY };
      velX = velY = 0;
    });
    helpers.on(canvas, 'pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastPos.x;
      const dy = e.clientY - lastPos.y;
      velY = dx * 0.0025;
      velX = dy * 0.0025;
      rotY += velY;
      rotX += velX;
      lastPos = { x: e.clientX, y: e.clientY };
    });
    const stopDrag = () => (dragging = false);
    helpers.on(canvas, 'pointerup', stopDrag);
    helpers.on(canvas, 'pointerleave', stopDrag);

    function rotate([x, y, z]) {
      // X축 회전
      let y1 = y * Math.cos(rotX) - z * Math.sin(rotX);
      let z1 = y * Math.sin(rotX) + z * Math.cos(rotX);
      // Y축 회전
      let x2 = x * Math.cos(rotY) + z1 * Math.sin(rotY);
      let z2 = -x * Math.sin(rotY) + z1 * Math.cos(rotY);
      return [x2, y1, z2];
    }

    function project(p, cx, cy, f, camZ) {
      const z = p[2] + camZ;
      const scale = f / z;
      return { x: cx + p[0] * scale, y: cy + p[1] * scale, z };
    }

    helpers.loop(() => {
      const w = helpers.width();
      const h = helpers.height();
      ctx.fillStyle = '#0c0d16';
      ctx.fillRect(0, 0, w, h);

      // 배경에 은은한 별 몇 개 (매 프레임 고정 시드로 재계산 — 가볍고 충분히 화려함)
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let i = 0; i < 60; i++) {
        const sx = (i * 137.5) % w;
        const sy = (i * 91.3) % h;
        ctx.fillRect(sx, sy, 1.4, 1.4);
      }

      if (!dragging) {
        rotY += velY;
        rotX += velX;
        velX *= 0.995; // 드래그를 놓은 뒤 서서히 감속(관성)
        velY += (0.006 - velY) * 0.01; // 결국 기본 자동회전 속도로 수렴
      }

      const camZ = 330;
      const f = 380;
      const cx = w / 2;
      const cy = h / 2;

      const rotated = verts.map(rotate);
      const projected = rotated.map((p) => project(p, cx, cy, f, camZ));

      const lightDir = normalize([0.4, -0.5, -1]);

      const drawList = faces
        .map((face) => {
          const avgZ = face.idx.reduce((s, i) => s + rotated[i][2], 0) / 4;
          const n = faceNormal(rotated, face.idx);
          const brightness = Math.max(0.4, dot(n, lightDir) * -1);
          return { face, avgZ, brightness };
        })
        .sort((a, b) => b.avgZ - a.avgZ); // 먼 면(z가 큰 면)부터 그림

      for (const { face, brightness } of drawList) {
        const pts = face.idx.map((i) => projected[i]);
        ctx.beginPath();
        pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.closePath();
        const [r, g, b] = face.color;
        ctx.fillStyle = `rgb(${r * brightness}, ${g * brightness}, ${b * brightness})`;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.fillText('드래그해서 큐브를 직접 돌려보세요', 14, h - 16);
    });

    function faceNormal(rv, idx) {
      const [a, b, c] = idx.map((i) => rv[i]);
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      return normalize(cross(u, v));
    }
    function cross(a, b) {
      return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    }
    function dot(a, b) {
      return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }
    function normalize(v) {
      const len = Math.hypot(v[0], v[1], v[2]) || 1;
      return [v[0] / len, v[1] / len, v[2] / len];
    }
  },
});
})();
