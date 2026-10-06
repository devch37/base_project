# labs — 실습 환경

> "읽는 공부"가 아니라 **실행하고 관찰하는** 공부. 모든 P0 개념에는 랩이 있다.

## 스택 기동

```bash
cd backend-cs-tutor/labs
docker compose up -d                    # 전체 (postgres, redis, kafka, prometheus, grafana, toolbox)
docker compose up -d postgres redis     # 필요한 것만
docker compose --profile web up -d      # + nginx
docker compose ps
docker compose down                     # 정지 (down -v 로 볼륨까지)
```

| 서비스 | 포트 | 용도 |
|---|---|---|
| postgres | 5432 | Part 5 전체. `max_connections=50`, slow query 로깅 200ms |
| pgbouncer | 6432 | Part 5.16 커넥션 풀 |
| redis | 6379 | Part 10. `maxmemory 128mb` (eviction 실습) |
| kafka | 9092 | Part 12 (KRaft, 파티션 3) |
| kafka-ui | 8085 | Kafka 시각화 |
| prometheus | 9090 | Part 15 |
| grafana | 3000 | Part 15 (admin/admin) |
| nginx | 8080 | Part 4.14 / 8.8 (`--profile web`) |
| toolbox | — | 리눅스 도구 셸: `docker compose exec toolbox bash` (strace, ss, tcpdump, dig, lsof, htop) |

## sample-app

`sample-app/` 는 랩 전반에서 재사용하는 Spring Boot 앱 (주문/재고 도메인).
랩이 누적되며 Part 16 System Design의 실제 코드베이스가 된다.
Part 8 (Web Server)에서 처음 만들고, 이후 Part마다 기능을 붙인다.

- 포트: 8081 (`server.port=8081`)
- `/actuator/prometheus` 노출 (Micrometer)

## 디렉터리

```
labs/
├── docker-compose.yml
├── observability/prometheus.yml
├── web/nginx.conf
├── sample-app/          # 재사용 Spring Boot 앱
└── <part>/<lab>/        # Part별 실습 스크립트 + README
```

## 랩 진행 방식

1. Claude가 단계별 명령을 제시
2. 학습자가 실행
3. **출력을 붙여넣음**
4. Claude와 함께 "왜 이렇게 되었는가" 해석
