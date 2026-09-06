/**
 * lib/math.ts — 이름 있는 export(named export) 예시 모듈
 * ----------------------------------------------------------------------------
 * NodeNext 모듈 설정에서는 상대경로 import 시 확장자(.js)를 붙여야 합니다.
 * (TS 파일이지만 "컴파일 후" 기준이라 .js 로 씁니다 — 09번 레슨 본문 참고)
 */

// 여러 개를 각각 export
export const PI = 3.14159;

export function circleArea(radius: number): number {
  return PI * radius * radius;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// 타입도 export 할 수 있다
export interface Range {
  min: number;
  max: number;
}
