# Lab 01 — OSI 계층 실제로 눈으로 보기

## 실습 목표
- 패킷 하나가 각 계층을 통과하는 과정을 직접 캡처해서 확인한다
- Ethernet 헤더, IP 헤더, TCP 헤더, HTTP 페이로드를 실제로 읽는다
- OSI 7계층이 이론이 아니라 실제 패킷 안에 존재한다는 것을 체감한다

## 파일 목록
| 파일 | 설명 |
|------|------|
| `step1_capture_ping.sh` | ICMP 패킷 캡처 |
| `step2_http_server.py` | 간단한 HTTP 서버 |
| `step3_capture_http.sh` | HTTP 패킷 전체 캡처 |
| `step4_analyze.sh` | 헤더 분석 스크립트 |

## 실습 순서
1. Step 1: ICMP (ping) 패킷 캡처 → L3 ICMP 확인
2. Step 2: 로컬 HTTP 서버 실행
3. Step 3: HTTP 요청 캡처 → L2~L7 전 계층 확인
4. Step 4: 헤더 필드 직접 분석
