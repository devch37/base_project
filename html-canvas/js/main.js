/**
 * main.js
 * ------------------------------------------------------------------
 * Canvas 튜토리얼의 코어 로직입니다.
 *   1) 각 데모 파일(js/demos/*.js)이 registerDemo() 를 호출해 자기 자신을 등록하고
 *   2) 사이드바 네비게이션을 만들고 클릭 시 데모를 전환하며
 *   3) 캔버스 크기 조정(devicePixelRatio 대응), 애니메이션 루프,
 *      이벤트 리스너 정리(cleanup)를 공통으로 관리합니다.
 *
 * 데모 하나하나는 아래 형태의 객체입니다.
 *   {
 *     id: 'shapes',
 *     category: '기초',
 *     title: '기본 도형 그리기',
 *     desc: '설명 문구',
 *     points: ['핵심 포인트1', '핵심 포인트2'],
 *     file: 'js/demos/01-shapes.js',   // "코드 보기" 에서 fetch 할 경로
 *     init(ctx, canvas, helpers) { ... }
 *   }
 */
const App = (() => {
  const registry = [];               // 등록된 모든 데모
  let current = null;                // 현재 실행 중인 데모
  let rafId = null;                  // 현재 데모가 쓰고 있는 requestAnimationFrame id
  let cleanupFns = [];               // 데모 전환 시 실행할 정리 함수들
  let resizeTimer = null;

  const canvas = () => document.getElementById('stage');
  const ctx = () => canvas().getContext('2d');

  /* ---------------------------------------------------------
   * 데모 등록 (각 demos/*.js 파일 맨 아래에서 호출)
   * --------------------------------------------------------- */
  function registerDemo(demo) {
    registry.push(demo);
  }

  /* ---------------------------------------------------------
   * 캔버스를 화면 표시 크기(CSS px)에 맞춰 리사이즈하면서
   * devicePixelRatio 를 반영해 레티나 디스플레이에서도 선명하게 그립니다.
   *
   * 핵심 트릭:
   *  - canvas.width/height (실제 픽셀 버퍼)는 CSS 크기 * dpr 로 크게 잡고
   *  - ctx.scale(dpr, dpr) 로 좌표계를 CSS px 기준으로 되돌려 놓으면
   *    이후 모든 그리기 코드는 dpr을 신경 쓰지 않고 CSS px 단위로 작성 가능합니다.
   * --------------------------------------------------------- */
  function fitCanvasToDisplaySize() {
    const c = canvas();
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));

    // width/height 를 바꾸면 캔버스 내용이 자동으로 지워지고
    // 그려진 상태(transform 등)도 초기화된다는 점에 주의합니다.
    c.width = w * dpr;
    c.height = h * dpr;

    const context = ctx();
    context.setTransform(1, 0, 0, 1, 0, 0); // 이전 transform 초기화
    context.scale(dpr, dpr);
  }

  /* ---------------------------------------------------------
   * 데모가 사용할 도우미 모음.
   * init(ctx, canvas, helpers) 형태로 각 데모에 전달됩니다.
   * --------------------------------------------------------- */
  function makeHelpers() {
    return {
      // CSS px 기준 캔버스 크기
      width: () => canvas().getBoundingClientRect().width,
      height: () => canvas().getBoundingClientRect().height,

      // requestAnimationFrame 루프를 등록. 데모 전환 시 자동으로 cancel 됩니다.
      loop(callback) {
        const frame = (t) => {
          callback(t);
          rafId = requestAnimationFrame(frame);
        };
        rafId = requestAnimationFrame(frame);
      },

      // 이벤트 리스너를 추가하면서, 데모 전환 시 자동 해제되도록 등록합니다.
      on(target, type, handler, opts) {
        target.addEventListener(type, handler, opts);
        cleanupFns.push(() => target.removeEventListener(type, handler, opts));
      },

      // 데모 전용 정리 로직이 필요하면 직접 등록할 수 있습니다.
      onCleanup(fn) {
        cleanupFns.push(fn);
      },

      // 컨트롤 패널(슬라이더/버튼 등)을 데모 위에 그리기 위한 컨테이너
      controls: document.getElementById('controls'),

      clear() {
        const c = canvas();
        ctx().clearRect(0, 0, c.getBoundingClientRect().width, c.getBoundingClientRect().height);
      },
    };
  }

  /* ---------------------------------------------------------
   * 데모 전환: 이전 데모 정리 -> 캔버스 리셋 -> 새 데모 init 호출
   * --------------------------------------------------------- */
  function loadDemo(id) {
    const demo = registry.find((d) => d.id === id);
    if (!demo) return;

    // 1) 이전 데모 정리
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    cleanupFns.forEach((fn) => fn());
    cleanupFns = [];
    document.getElementById('controls').innerHTML = '';

    // 2) 캔버스 초기화
    fitCanvasToDisplaySize();

    // 3) UI 텍스트 갱신
    current = demo;
    document.getElementById('demo-title').textContent = demo.title;
    document.getElementById('demo-desc').textContent = demo.desc;
    document.getElementById('code-filename').textContent = demo.file;
    const pointsEl = document.getElementById('demo-points');
    pointsEl.innerHTML = (demo.points || []).map((p) => `<li>${p}</li>`).join('');

    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.id === id);
    });

    location.hash = id;

    // 4) 새 데모 실행
    demo.init(ctx(), canvas(), makeHelpers());
  }

  function restartCurrent() {
    if (current) loadDemo(current.id);
  }

  /* ---------------------------------------------------------
   * 사이드바 네비게이션 렌더링 (category 별로 그룹핑)
   * --------------------------------------------------------- */
  function renderNav() {
    const nav = document.getElementById('nav-list');
    const categories = [];
    registry.forEach((d) => {
      let cat = categories.find((c) => c.name === d.category);
      if (!cat) {
        cat = { name: d.category, demos: [] };
        categories.push(cat);
      }
      cat.demos.push(d);
    });

    nav.innerHTML = categories
      .map(
        (cat) => `
        <div class="nav-category">
          <p class="nav-category-title">${cat.name}</p>
          ${cat.demos
            .map(
              (d, i) => `
              <button class="nav-item" data-id="${d.id}">
                <span class="num">${String(d.globalIndex).padStart(2, '0')}</span>
                <span>${d.title}</span>
              </button>`
            )
            .join('')}
        </div>`
      )
      .join('');

    nav.querySelectorAll('.nav-item').forEach((btn) => {
      btn.addEventListener('click', () => loadDemo(btn.dataset.id));
    });
  }

  /* ---------------------------------------------------------
   * "코드 보기": 현재 데모의 원본 .js 파일을 fetch 해서
   * 아주 가벼운 문법 하이라이트(주석/문자열/키워드)를 입혀 보여줍니다.
   * (로컬 정적 서버로 열어야 fetch 가 동작합니다 - file:// 는 CORS 로 막힙니다)
   * --------------------------------------------------------- */
  function escapeHtml(str) {
    return str.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  }

  function highlight(src) {
    const escaped = escapeHtml(src);
    // 주석/문자열/키워드를 별도의 replace() 를 연달아 실행하면, 앞선 단계에서 삽입한
    // <span class="tok-string"> 같은 HTML 속성의 따옴표까지 "문자열"로 다시 매칭해버려
    // 마크업이 깨지는 문제가 있었습니다. 그래서 하나의 정규식 안에 우선순위대로
    // 대안(comment | string | keyword)을 나열해 원본 텍스트를 "한 번만" 스캔합니다.
    const pattern =
      /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)|\b(function|const|let|var|if|else|for|while|return|new|class|extends|this|true|false|null|undefined|typeof|of|in|break|continue|switch|case|default|try|catch)\b/gm;
    return escaped.replace(pattern, (match, lineComment, blockComment, string, keyword) => {
      if (lineComment || blockComment) return `<span class="tok-comment">${lineComment || blockComment}</span>`;
      if (string) return `<span class="tok-string">${string}</span>`;
      if (keyword) return `<span class="tok-keyword">${keyword}</span>`;
      return match;
    });
  }

  async function showCode() {
    if (!current) return;
    const overlay = document.getElementById('code-overlay');
    const codeEl = document.getElementById('code-content');
    overlay.classList.remove('hidden');
    codeEl.textContent = '불러오는 중...';
    try {
      const res = await fetch(current.file);
      const text = await res.text();
      codeEl.innerHTML = highlight(text);
    } catch (e) {
      codeEl.textContent =
        '코드를 불러오지 못했습니다. 로컬 서버(예: python3 -m http.server)로 열었는지 확인해주세요.\n\n' + e;
    }
  }

  function hideCode() {
    document.getElementById('code-overlay').classList.add('hidden');
  }

  /* ---------------------------------------------------------
   * 부팅
   * --------------------------------------------------------- */
  function boot() {
    registry.forEach((d, i) => (d.globalIndex = i + 1));
    renderNav();

    document.getElementById('btn-restart').addEventListener('click', restartCurrent);
    document.getElementById('btn-code').addEventListener('click', showCode);
    document.getElementById('btn-close-code').addEventListener('click', hideCode);
    document.getElementById('code-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'code-overlay') hideCode();
    });

    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(restartCurrent, 150);
    });

    const startId = location.hash.replace('#', '') || registry[0]?.id;
    if (startId) loadDemo(startId);
  }

  return { registerDemo, boot };
})();

// 각 데모 파일에서 사용할 전역 등록 함수
function registerDemo(demo) {
  App.registerDemo(demo);
}
