(function () {
/**
 * 25-game-of-life.js — 콘웨이의 생명 게임 (Cellular Automaton)
 * ------------------------------------------------------------------
 * 격자의 각 칸은 "생존" 또는 "죽음" 두 상태만 가지며, 아주 단순한 규칙만으로
 * 매 세대(generation)마다 다음 상태가 결정됩니다 (John Conway, 1970).
 *
 *   1) 살아있는 칸은 이웃(8방향)이 2~3개 살아있으면 다음 세대에도 생존합니다.
 *   2) 살아있는 칸은 이웃이 1개 이하(외로움) 또는 4개 이상(과밀)이면 죽습니다.
 *   3) 죽은 칸은 이웃이 정확히 3개면 다음 세대에 새로 태어납니다.
 *
 *  - 그리드는 두 개의 배열(현재/다음 세대)을 번갈아 사용해, "읽으면서 동시에
 *    쓰는" 문제 없이 세대 전체를 한 번에 갱신합니다.
 *  - 가장자리는 반대편과 이어진 것으로 취급(토러스/원환면)해서 패턴이 끊기지 않게 했습니다.
 *  - 태어난 지 얼마 안 된 칸일수록 밝게 그려서, 활동이 많은 영역이 시각적으로 도드라집니다.
 */
registerDemo({
  id: 'game-of-life',
  category: '8. 3D & 게임',
  title: '콘웨이의 생명 게임',
  desc: '단순한 이웃 규칙만으로 스스로 진화하는 셀룰러 오토마타. 클릭/드래그로 셀 편집',
  file: 'js/demos/25-game-of-life.js',
  points: [
    '생존/탄생/죽음 규칙은 오직 "8방향 이웃 중 살아있는 칸의 개수"만으로 결정됩니다.',
    '현재 세대를 읽으면서 동시에 덮어쓰지 않도록, 두 개의 배열을 번갈아 사용합니다.',
    '가장자리를 반대편과 연결(토러스)해 패턴이 경계에서 끊기지 않도록 했습니다.',
    '막 태어난 셀일수록 밝게 그려 "나이"에 따른 색상 그라디언트를 표현했습니다.',
  ],
  init(ctx, canvas, helpers) {
    const CELL = 9;
    let cols, rows, grid, age, playing = true, stepAcc = 0;
    const state = { speed: 12 }; // 초당 세대 수

    helpers.controls.innerHTML = `
      <button id="gol-play">⏸ 일시정지</button>
      <button id="gol-random">랜덤 채우기</button>
      <button id="gol-clear">전체 지우기</button>
      <label>속도 <input id="gol-speed" type="range" min="1" max="30" value="12" /></label>
    `;
    const playBtn = document.getElementById('gol-play');
    helpers.on(playBtn, 'click', () => {
      playing = !playing;
      playBtn.textContent = playing ? '⏸ 일시정지' : '▶ 재생';
    });
    helpers.on(document.getElementById('gol-random'), 'click', randomize);
    helpers.on(document.getElementById('gol-clear'), 'click', () => {
      grid.fill(0);
      age.fill(0);
    });
    helpers.on(document.getElementById('gol-speed'), 'input', (e) => (state.speed = Number(e.target.value)));

    function setup() {
      const w = helpers.width();
      const h = helpers.height();
      cols = Math.floor(w / CELL);
      rows = Math.floor(h / CELL);
      grid = new Uint8Array(cols * rows);
      age = new Uint8Array(cols * rows);
      randomize();
    }
    function randomize() {
      for (let i = 0; i < grid.length; i++) {
        grid[i] = Math.random() < 0.22 ? 1 : 0;
        age[i] = grid[i] ? 1 : 0;
      }
    }
    setup();

    function idx(x, y) {
      return y * cols + x;
    }

    function countNeighbors(x, y) {
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = (x + dx + cols) % cols; // 토러스: 가장자리를 반대편과 연결
          const ny = (y + dy + rows) % rows;
          count += grid[idx(nx, ny)];
        }
      }
      return count;
    }

    function step() {
      const next = new Uint8Array(grid.length);
      const nextAge = new Uint8Array(age.length);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = idx(x, y);
          const n = countNeighbors(x, y);
          const alive = grid[i] === 1;
          const willLive = alive ? n === 2 || n === 3 : n === 3;
          next[i] = willLive ? 1 : 0;
          nextAge[i] = willLive ? Math.min(255, (alive ? age[i] : 0) + 1) : 0;
        }
      }
      grid = next;
      age = nextAge;
    }

    function toggleAt(e) {
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / CELL);
      const y = Math.floor((e.clientY - rect.top) / CELL);
      if (x < 0 || y < 0 || x >= cols || y >= rows) return;
      grid[idx(x, y)] = 1;
      age[idx(x, y)] = 1;
    }
    let painting = false;
    helpers.on(canvas, 'pointerdown', (e) => {
      painting = true;
      toggleAt(e);
    });
    helpers.on(canvas, 'pointermove', (e) => painting && toggleAt(e));
    helpers.on(canvas, 'pointerup', () => (painting = false));
    helpers.on(canvas, 'pointerleave', () => (painting = false));

    helpers.loop(() => {
      const w = helpers.width();
      const h = helpers.height();
      ctx.fillStyle = '#0b0c14';
      ctx.fillRect(0, 0, w, h);

      if (playing) {
        stepAcc++;
        if (stepAcc >= Math.round(60 / state.speed)) {
          step();
          stepAcc = 0;
        }
      }

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = idx(x, y);
          if (!grid[i]) continue;
          const a = age[i];
          const hue = 165 - Math.min(a, 40) * 2; // 오래될수록 초록→파랑 계열로
          const light = 40 + Math.min(a, 20) * 2;
          ctx.fillStyle = `hsl(${hue}, 70%, ${light}%)`;
          ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1);
        }
      }

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.fillText(`${cols}×${rows} 셀 — 클릭/드래그로 셀을 켤 수 있습니다`, 10, h - 10);
    });
  },
});
})();
