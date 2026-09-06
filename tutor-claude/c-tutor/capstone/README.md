# 캡스톤: 미니 키-값 저장소 (`kv`)

00~21장에서 배운 것을 하나로 묶은 실전 프로그램. 자세한 해설은 [../docs/22](../docs/22-캡스톤-미니-KV-저장소.md).

## 빌드 & 실행

```bash
# Make
make
./bin/kv set name alice
./bin/kv get name          # alice
./bin/kv list
./bin/kv del name
./bin/kv compact
make test                  # 단위 테스트 (131 checks)
make asan                  # 새니타이저로 테스트

# CMake
cmake -S . -B build && cmake --build build -j
ctest --test-dir build --output-on-failure
./build/kv -f my.db set k v
```

기본 저장 파일은 `store.db`. `-f <파일>` 로 바꿀 수 있습니다.
종료 코드: `0` 성공, `1` 키 없음/실패, `2` 사용법 오류 → 셸 스크립트에서 사용 가능.

```bash
if ./bin/kv get session-token >/dev/null 2>&1; then echo "토큰 있음"; fi
```

## 구조

| 파일 | 역할 | 관련 장 |
|---|---|---|
| `include/kvstore.h` | 공개 API (불투명 포인터) | 11 |
| `src/serialize.h` | 빅엔디언 정수 직렬화 + CRC32 | 16 |
| `src/hashmap.h` | string→string 해시맵 (체이닝, FNV-1a) | 14, 15 |
| `src/kvstore.c` | append-only 로그 + 인메모리 인덱스 + 크래시 복구 | 8, 9, 13, 20 |
| `src/main.c` | CLI 인자 파싱, 명령 디스패치 | 4, 12 |
| `tests/test_kvstore.c` | assert 기반 테스트 (기본/영속성/compact/복구) | 12, 21 |

## 동작 원리

- **쓰기**(`set`/`del`)는 `store.db` 끝에 레코드를 덧붙이고 즉시 `fflush`.
- **읽기**(`get`)는 인메모리 해시맵 조회 → O(1). 디스크를 안 뒤짐.
- **시작 시** 로그를 처음부터 재생해 해시맵을 재구축.
- **크래시 복구**: 재생 중 잘리거나 CRC가 안 맞는 마지막 레코드는 잘라내고 계속.
- **compact**: 현재 인덱스만 새 로그로 다시 써서 죽은 레코드 제거 (`rename` 으로 원자적 교체).

## 직접 해 볼 것

`truncate -s -3 store.db` 로 파일 끝을 훼손한 뒤 `./bin/kv list` — 크래시 없이 복구되나요?
`docs/22` 의 확장 과제(TTL, 스캔, 동시성, 네트워크 서버)도 도전해 보세요.
