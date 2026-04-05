# 02. 네트워크 기본기 (TCP/IP, DNS, HTTP)

## 목표
- 웹/서버 보안 이슈를 네트워크 흐름 관점에서 이해한다.
- TLS와 인증서의 기본 구조를 설명할 수 있다.

## 핵심 개념
- TCP 3-way handshake, 포트/소켓
- DNS 해석 과정, 캐시와 TTL
- HTTP 요청/응답, 쿠키/세션, 상태 코드
- TLS 핸드셰이크 개념과 인증서 체인

## 설명(주석)
보안 사고의 많은 원인이 “서버가 어떻게 노출되는지”에 대한 오해에서 시작된다. 네트워크 계층을 이해하면 웹 취약점도 **유입 경로와 방어 지점**이 명확해진다.

## 체크리스트
- 서비스가 노출하는 포트와 프로토콜을 문서화했는가
- TLS가 실제로 적용되는 구간(프록시/로드밸런서 포함)을 이해하는가
- 쿠키의 보안 속성(`HttpOnly`, `Secure`, `SameSite`) 의미를 설명할 수 있는가

## Java/Spring 체크리스트
- `resources/checklists/02_network_checklist.md`

## 실습 연결
- `labs/lab-setup.md`
- `labs/lab-security-headers.md`
