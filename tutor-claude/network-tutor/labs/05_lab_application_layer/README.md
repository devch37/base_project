# Lab 05 — DNS & HTTP & TLS 해부

## 실습 목표
- `dig +trace`로 DNS 재귀 질의 전 과정을 추적한다
- curl 타이밍 옵션으로 각 단계 지연을 측정한다
- openssl로 TLS 인증서와 핸드셰이크를 직접 분석한다

## 파일 목록
| 파일 | 설명 |
|------|------|
| `step1_dns_lab.sh` | DNS 재귀 질의 추적 & 레코드 분석 |
| `step2_http_lab.sh` | HTTP/1.1·2·3 비교, 헤더 분석, 캐시 실습 |
| `step3_tls_lab.sh` | TLS 핸드셰이크 분석, 인증서 파싱 |
| `step4_http_server_advanced.py` | HTTP 캐시·압축·쿠키 실습 서버 |
