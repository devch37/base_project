# examples/11 — 다중 파일 빌드 직접 해 보기

```
counter.h / counter.c   불투명 포인터로 캡슐화한 카운터 모듈
strutil.h / strutil.c   문자열 유틸 모듈
main.c                  진입점 (헤더만 보고 컴파일됨)
```

## 1. 한 방에 빌드 (프로젝트 Makefile)

```bash
make 11
./bin/11_multifile
```

## 2. 단계별로 직접

```bash
cd examples/11

# ① 각 컴파일 단위를 따로 오브젝트 파일로
cc -std=c11 -Wall -Wextra -c counter.c   # -> counter.o
cc -std=c11 -Wall -Wextra -c strutil.c   # -> strutil.o
cc -std=c11 -Wall -Wextra -c main.c      # -> main.o

# 심볼 확인: U = 미정의(다른 곳에서 와야 함), T = 이 파일이 정의
nm main.o | grep -E ' U | T '

# ② 링크
cc counter.o strutil.o main.o -o app
./app
```

## 3. 정적 라이브러리로 묶기

```bash
cc -c -O2 counter.c strutil.c
ar rcs libmini.a counter.o strutil.o
ar t libmini.a                      # 아카이브 내용 목록
cc main.c -L. -lmini -o app         # libmini.a 에서 필요한 .o 만 뽑아 링크
./app
```

## 4. 동적 라이브러리로 (macOS: .dylib / Linux: .so)

```bash
# Linux
cc -c -fPIC counter.c strutil.c
cc -shared counter.o strutil.o -o libmini.so
cc main.c -L. -lmini -Wl,-rpath,. -o app
./app

# macOS
cc -dynamiclib counter.c strutil.c -o libmini.dylib
cc main.c -L. -lmini -o app
./app
```

## 실습

- `counter.c` 의 `struct Counter` 에 필드를 추가한 뒤 `counter.o` 만 다시 만들고
  `main.o` 는 그대로 재링크 → 여전히 동작하는지 확인 (불투명 포인터의 이점).
- 헤더에 `int shared = 0;` (정의)를 넣고 `counter.c` 와 `main.c` 양쪽에서 include →
  `duplicate symbol` 재현 → `extern` + 한 곳 정의로 수정.
