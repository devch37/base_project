# 빠른 시작 (Quick Start)

## 1. 설치 (딱 한 번)

```bash
cd typescript-tutor
npm install
```

## 2. 첫 레슨 실행

```bash
npx tsx src/1-basic/01-types.ts
```

콘솔에 결과가 찍히면 성공입니다.

## 3. 학습 흐름

```
README.md            ← 전체 커리큘럼 (먼저 훑어보기)
LEARNING_GUIDE.md    ← 개념 흐름과 학습 팁
src/1-basic/         ← 여기부터 순서대로
  ├─ README.md       ← 단계 요약 / 치트시트
  ├─ 01-types.ts     ← 파일을 열어 주석을 읽으며 실행
  ├─ 02-functions.ts
  └─ ...
src/2-intermediate/
src/3-advanced/
src/4-practical/
exercises/README.md  ← 손으로 익히기
```

## 4. 자주 쓰는 명령어

| 명령어 | 설명 |
|--------|------|
| `npx tsx <파일>` | 레슨 파일 하나 실행 |
| `npm run lesson <파일>` | 위와 동일 (별칭) |
| `npm run basic` | 1단계 5개 레슨 연속 실행 |
| `npm run typecheck` | 전체 타입 검사 (실행 X, 오류만 확인) |
| `npm run build` | `dist/` 에 JS로 컴파일 |
| `npm run clean` | `dist/` 삭제 |

## 5. 추천 도구

- **에디터**: VS Code (TypeScript 지원 내장)
- **실시간 타입 검사**: 터미널에서 `npx tsc --noEmit --watch`
- **VS Code 확장**: "Error Lens" (에러를 코드 옆에 바로 표시)

## 6. 문제 해결

| 증상 | 해결 |
|------|------|
| `Cannot find module './xxx'` | NodeNext 설정이라 상대경로 import에 `.js` 확장자를 붙여야 함 (09번 레슨 참고) |
| `command not found: tsx` | `npm install` 을 실행했는지 확인 |
| 한글이 깨짐 | 터미널 인코딩을 UTF-8로 설정 |
| 데코레이터 관련 에러 | `tsconfig.json` 의 `experimentalDecorators: true` 확인 (이미 설정됨) |
