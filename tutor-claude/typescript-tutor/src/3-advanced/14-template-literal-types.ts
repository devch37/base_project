/**
 * ============================================================================
 * 14. 템플릿 리터럴 타입 (Template Literal Types)
 * ============================================================================
 *
 * 문자열 리터럴 타입을 백틱(`)으로 조합/분해합니다.
 * 이벤트 이름, CSS 속성, 라우트 경로처럼 "문자열 규칙"이 있는 곳에서 강력합니다.
 *
 * 실행:  npx tsx src/3-advanced/14-template-literal-types.ts
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1) 기본 조합
// ----------------------------------------------------------------------------
type Lang = 'ko' | 'en' | 'ja';
type Region = 'KR' | 'US' | 'JP';
type Locale = `${Lang}-${Region}`;
// 'ko-KR' | 'ko-US' | 'ko-JP' | 'en-KR' | ... (3 x 3 = 9가지 조합 자동 생성)

const locale: Locale = 'ko-KR';
// const bad: Locale = 'ko_KR'; // ❌ 형식이 안 맞음

// ----------------------------------------------------------------------------
// 2) 내장 문자열 변형 유틸과 함께
// ----------------------------------------------------------------------------
type EventName<T extends string> = `on${Capitalize<T>}`;
type ClickEvent = EventName<'click'>; // 'onClick'
type FocusEvent = EventName<'focus'>; // 'onFocus'

// ----------------------------------------------------------------------------
// 3) 객체 키로부터 이벤트 핸들러 타입 만들기 (13번 키 리매핑 + 14번)
// ----------------------------------------------------------------------------
interface FormData {
  username: string;
  email: string;
}

// username -> onUsernameChange(value: string) ...
type ChangeHandlers<T> = {
  [K in keyof T as `on${Capitalize<string & K>}Change`]: (value: T[K]) => void;
};
type FormHandlers = ChangeHandlers<FormData>;
// { onUsernameChange: (value: string) => void; onEmailChange: (value: string) => void }

// ----------------------------------------------------------------------------
// 4) 문자열 분해 (infer + 템플릿 리터럴)
// ----------------------------------------------------------------------------
// 'GET /users/:id' 같은 라우트 문자열에서 파라미터 이름 뽑아내기
type ExtractParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<`/${Rest}`>
    : T extends `${string}:${infer Param}`
      ? Param
      : never;

type Route = '/users/:userId/posts/:postId';
type RouteParams = ExtractParams<Route>; // 'userId' | 'postId'

// 위 타입으로 params 객체 강제
type ParamsObject<T extends string> = {
  [K in ExtractParams<T>]: string;
};
function buildUrl<T extends string>(route: T, params: ParamsObject<T>): string {
  let url: string = route;
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`:${key}`, String(value));
  }
  return url;
}

// ----------------------------------------------------------------------------
// 5) 실무: 환경변수 접두사 규칙, CSS 단위 등
// ----------------------------------------------------------------------------
type EnvVar = `NEXT_PUBLIC_${string}`;
const publicEnv: EnvVar = 'NEXT_PUBLIC_API_URL';

type PixelValue = `${number}px`;
const width: PixelValue = '320px';

// ----------------------------------------------------------------------------
// 실행 결과 확인
// ----------------------------------------------------------------------------
console.log('--- 14. 템플릿 리터럴 타입 ---');
console.log('locale =', locale, '| publicEnv =', publicEnv, '| width =', width);

const handlers: FormHandlers = {
  onUsernameChange: (v) => console.log('username 변경:', v),
  onEmailChange: (v) => console.log('email 변경:', v),
};
handlers.onUsernameChange('newname');

const url = buildUrl('/users/:userId/posts/:postId', {
  userId: '42',
  postId: '7',
  // teamId: 'x', // ❌ 라우트에 없는 파라미터
});
console.log('buildUrl =', url);

export {};
