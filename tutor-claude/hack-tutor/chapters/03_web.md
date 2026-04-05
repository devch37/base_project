# 03. 웹 보안 기초 (OWASP Top 10 중심)

## 목표
- OWASP Top 10을 기준으로 웹 취약점의 **원리와 방어책**을 이해한다.
- 개발자가 자주 실수하는 패턴을 구분한다.

## 핵심 개념
- 인증(Authentication) vs 인가(Authorization)
- 입력 검증/출력 인코딩의 역할
- 세션 관리 기본 원칙
- 보안 헤더의 의미

## 설명(주석)
취약점 “재현 방법”보다 중요한 것은 **왜 발생했고 어떻게 막는가**다. 중급 개발자는 코드 레벨에서 방어 패턴을 습관화하는 것이 핵심이다.

## 체크리스트
- 입력은 검증하고, 출력은 컨텍스트에 맞게 인코딩하는가
- 인증과 인가 로직이 명확히 분리되어 있는가
- 세션/토큰 만료 전략이 명확한가

## Java/Spring 체크리스트
- `resources/checklists/03_web_checklist.md`

## 실습 연결
- `labs/lab-input-validation.md`
- `labs/lab-security-headers.md`
