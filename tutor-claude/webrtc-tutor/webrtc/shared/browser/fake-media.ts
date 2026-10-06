/**
 * fake-media.ts — 카메라/마이크 없이도 "진짜 MediaStream" 만들기
 *
 * 왜 필요한가?
 *   - 개발 PC 에 카메라가 없거나, 두 탭에서 같은 카메라를 동시에 못 쓰거나, CI(헤드리스)에는 장치가 없다.
 *   - 그래도 WebRTC 학습/테스트를 하려면 "움직이는 영상 + 소리가 나는 오디오" 트랙이 필요하다.
 *
 * 만드는 방법
 *   영상: <canvas> 에 매 프레임 그림(프레임 번호, 시계, 움직이는 도형)을 그리고 `canvas.captureStream(fps)` 로 MediaStreamTrack 을 얻는다.
 *   오디오: WebAudio 의 OscillatorNode(사인파) → MediaStreamAudioDestinationNode → 오디오 트랙.
 *
 * 그린 프레임 번호가 증가하는지 상대 쪽에서 보면 "정말 영상이 흘러오고 있다"를 눈으로(또는 통계로) 확인할 수 있다.
 */

export interface FakeMediaOptions {
  width?: number;
  height?: number;
  fps?: number;
  label?: string;
  /** 화면 색조(0~360). 참가자마다 다르게 주면 구분하기 쉽다 */
  hue?: number;
  audio?: boolean;
  video?: boolean;
}

export interface FakeMedia {
  stream: MediaStream;
  /** 지금까지 그린 프레임 수 */
  frames(): number;
  stop(): void;
}

export function createFakeMedia(opts: FakeMediaOptions = {}): FakeMedia {
  const { width = 320, height = 180, fps = 30, label = 'fake', hue = 200, audio = true, video = true } = opts;
  const stream = new MediaStream();
  let frame = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  let audioCtx: AudioContext | undefined;
  let osc: OscillatorNode | undefined;

  if (video) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    const draw = () => {
      frame++;
      ctx.fillStyle = `hsl(${(hue + frame / 4) % 360} 60% 25%)`;
      ctx.fillRect(0, 0, width, height);
      // 움직이는 원: 영상이 "살아 있음"을 눈으로 확인
      const x = width / 2 + Math.cos(frame / 15) * (width / 3);
      const y = height / 2 + Math.sin(frame / 20) * (height / 4);
      ctx.fillStyle = `hsl(${hue} 90% 70%)`;
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(label, 12, 26);
      ctx.font = '14px monospace';
      ctx.fillText(`frame ${frame}`, 12, height - 28);
      ctx.fillText(new Date().toISOString().slice(11, 23), 12, height - 10);
    };
    draw();
    // setInterval 을 쓰는 이유: requestAnimationFrame 은 탭이 가려지면(백그라운드) 멈춘다. WebRTC 테스트 중 탭 전환에도 계속 그리려고.
    timer = setInterval(draw, 1000 / fps);
    // captureStream(fps): 캔버스가 바뀔 때마다 프레임을 내보내는 트랙. 인자를 주면 최대 fps 를 제한한다.
    for (const t of canvas.captureStream(fps).getVideoTracks()) stream.addTrack(t);
  }

  if (audio) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AC();
    osc = audioCtx.createOscillator();
    osc.frequency.value = 220 + (hue % 200); // 참가자별로 다른 음
    const gain = audioCtx.createGain();
    gain.gain.value = 0.02; // 아주 작게 (테스트 소리가 귀를 찌르지 않도록)
    const dest = audioCtx.createMediaStreamDestination();
    osc.connect(gain).connect(dest);
    osc.start();
    // 브라우저 자동재생 정책: 사용자 제스처 없이는 'suspended'. 가능하면 resume 시도 (실패해도 트랙은 존재한다)
    void audioCtx.resume().catch(() => {});
    for (const t of dest.stream.getAudioTracks()) stream.addTrack(t);
  }

  return {
    stream,
    frames: () => frame,
    stop: () => {
      if (timer) clearInterval(timer);
      osc?.stop();
      void audioCtx?.close();
      stream.getTracks().forEach((t) => t.stop());
    },
  };
}

/**
 * 실제 카메라/마이크를 시도하고, 실패하거나 `?fake` 쿼리가 있으면 가짜 미디어로 대체한다.
 * 개발자가 카메라 없이도, 반대로 카메라가 있을 땐 진짜로도 같은 코드를 쓰게 해 준다.
 */
export async function getMediaOrFake(constraints: MediaStreamConstraints = { video: true, audio: true }, fakeOpts: FakeMediaOptions = {}): Promise<{ stream: MediaStream; fake: boolean; stop(): void; frames?: () => number }> {
  const forceFake = new URLSearchParams(location.search).has('fake');
  if (!forceFake && navigator.mediaDevices?.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return { stream, fake: false, stop: () => stream.getTracks().forEach((t) => t.stop()) };
    } catch (e) {
      console.warn('getUserMedia 실패 → 가짜 미디어로 대체:', (e as Error).name, (e as Error).message);
    }
  }
  const f = createFakeMedia({ video: Boolean(constraints.video), audio: Boolean(constraints.audio), ...fakeOpts });
  return { stream: f.stream, fake: true, stop: f.stop, frames: f.frames };
}
