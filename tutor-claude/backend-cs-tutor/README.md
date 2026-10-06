# backend-cs-tutor

> **Framework를 사용하는 개발자 → Computer System을 이해하는 Backend Engineer** 로 성장하기 위한 장기 학습 프로젝트.

5년차 Java/Spring Boot 백엔드 개발자가 CS 기본기를 **처음부터 제대로** 다시 쌓습니다.
단순 개념 설명이 아니라, **"Controller 코드 한 줄 아래에서 컴퓨터 시스템 전체가 어떻게 움직이는가"**
를 설명할 수 있는 수준을 목표로 합니다.

---

## 이 프로젝트의 교육 원칙

모든 개념을 이 순서로 배웁니다.

```
현상 → Why → 내부 원리 → 실제 구현 → 백엔드 적용 → 장애 사례 → 실습 → 심화
```

그리고 5단계 깊이로 설명합니다.

| Level | 관점 | 예: "TCP" |
|-------|------|-----------|
| **L1** | 초등학생도 이해하는 직관 (비유) | "전화 통화처럼 먼저 연결하고 대화" |
| **L2** | 개발자가 알아야 하는 정확한 개념 | 연결 지향, 신뢰성, 순서 보장, 흐름/혼잡 제어 |
| **L3** | OS·커널·CPU·네트워크 내부 동작 | 소켓 버퍼, 시퀀스/ACK, 재전송 타이머, cwnd |
| **L4** | Java/Spring/PostgreSQL/Linux 실무 | Tomcat Connector, HikariCP, `ss -tan`, TIME_WAIT |
| **L5** | Senior — 성능·장애·확장·Trade-off·아키텍처 | Connection Pool 고갈, keep-alive 튜닝, LB 설계 |

**항상 WHY. 항상 Trade-off.** "Index는 빠르다"가 아니라 "왜 B+Tree Index가 조회를 빠르게 만드는가,
왜 모든 컬럼에 Index를 만들면 안 되는가"까지.

---

## 시작하는 법

이 프로젝트는 **Claude를 튜터로** 진행합니다.

```
나:    오늘 공부 시작하자
Claude: (PROGRESS.md + REVIEW.md 를 읽고)
        1) 오늘 복습할 항목이 있으면 먼저 (능동 회상)
        2) 오늘 학습 모듈 + 목표 안내
        3) 개념 → 질문 → 내 답변 → 피드백 → 실습 → 분석 → Quiz → Feynman 설명 → 복습 등록
```

- Claude 운영 규칙: [CLAUDE.md](./CLAUDE.md)
- 전체 커리큘럼·순서·우선순위: [ROADMAP.md](./ROADMAP.md)
- 내 진행 상태: [PROGRESS.md](./PROGRESS.md)
- 복습 큐: [REVIEW.md](./REVIEW.md)

### 실습 환경

```bash
cd backend-cs-tutor/labs
docker compose up -d        # PostgreSQL, Redis, Kafka, Prometheus, Grafana, 툴박스
```

---

## 디렉터리

```
backend-cs-tutor/
├── README.md ROADMAP.md PROGRESS.md REVIEW.md CLAUDE.md GLOSSARY.md
├── templates/            # 모듈/랩 템플릿
├── docs/
│   ├── 00-foundations ~ 17-failure-engineering   # 17개 Part
│   └── 99-integration/  # Cross-Layer 통합 문서 (가장 중요)
├── labs/
│   ├── docker-compose.yml
│   ├── sample-app/       # 랩 전반에서 재사용하는 Spring Boot 앱 (주문/재고 도메인)
│   └── <part>/
└── notes/                # 개인 노트
```

각 모듈은 10개 문서로 구성됩니다 (템플릿: [templates/module-template](./templates/module-template)).

| 파일 | 교육 단계 | Level |
|------|-----------|-------|
| `README.md` | 오리엔테이션 | 목표·선수지식·우선순위·예상시간 |
| `concept.md` | 현상 → Why | L1 직관 + L2 정확한 개념 |
| `internals.md` | 내부 원리 | L3 OS/커널/CPU/DB 내부 |
| `backend-example.md` | 실제 구현 → 백엔드 적용 | L4 Java/Spring/PG/Linux |
| `senior.md` | 심화 | L5 성능·확장·Trade-off·아키텍처 |
| `troubleshooting.md` | 장애 사례 | 증상→가설→확인→근본원인→해결→재발방지 |
| `lab.md` | 실습 | 실행 가능, 도구로 관찰 |
| `quiz.md` / `quiz-answers.md` | 검증 | 7가지 유형, 답 분리 |
| `interview.md` | 검증 | 주니어 설명 + 면접 질문 |
| `feynman.md` | Feynman | 내가 설명할 프롬프트 + 자가평가 |
| `summary.md` | 복습 | 1페이지 요약 |

---

## 이 프로젝트를 끝내면 답할 수 있어야 하는 질문

- HTTP 요청 하나가 Spring Boot까지 어떻게 도착하는가? (NIC → 커널 → epoll → Tomcat → Controller)
- Java 코드가 CPU에서 어떻게 실행되는가? (바이트코드 → JIT → 기계어 → 파이프라인)
- Thread와 Process의 실제 차이는? Virtual Memory는 왜 필요한가?
- DB Index는 내부적으로 어떻게 동작하는가? PostgreSQL MVCC는? DB Lock은 왜 발생하는가?
- TCP는 어떻게 신뢰성을 보장하는가? Redis는 왜 빠른가? Kafka는 왜 높은 Throughput을 내는가?
- JVM GC는 어떻게 동작하는가? 동시성 문제는 왜 발생하는가?
- 서버가 느려졌을 때 어디부터 확인하는가? CPU 100% 장애를 어떻게 분석하는가?
- DB Connection Pool이 고갈되면 무슨 일이 일어나는가?
- 대규모 Backend System을 어떻게 설계하는가? 장애에 강한 시스템은 어떻게 만드는가?
