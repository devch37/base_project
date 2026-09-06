# 18. 빌드 시스템 (Make · CMake)

> 목표: Make의 규칙·변수·자동 의존성, 증분 빌드가 동작하는 원리,
> CMake 프로젝트 구조, 그리고 `pkg-config`·설치·크로스 컴파일 개요.

---

## 0. 초등학생 버전 비유

Make는 **요리 레시피 카드**입니다. 각 카드에:
- **결과물**: "볶음밥"
- **재료**: "밥, 계란, 파"
- **만드는 법**: 조리 단계

Make는 똑똑해서 **재료가 결과물보다 새것일 때만** 다시 요리합니다. 밥을 새로 지었으면
볶음밥을 다시 만들지만, 아무것도 안 바뀌었으면 "이미 있잖아"라며 넘어갑니다. 이게 **증분 빌드**.

---

## 1. Makefile 문법

```makefile
target: prerequisites
<TAB>recipe                 # 반드시 탭! 스페이스 아님

app: main.o util.o          # app 은 main.o, util.o 에 의존
	cc main.o util.o -o app # 이 중 하나라도 app 보다 새로우면 실행

main.o: main.c util.h       # 헤더도 의존성에 넣어야 함 (안 그러면 헤더 수정이 반영 안 됨)
	cc -c main.c
```

Make는 **파일 수정 시각(mtime)** 을 비교합니다. `prerequisite`가 `target`보다 나중이면 재빌드.

### 변수와 자동 변수

```makefile
CC      := cc
CFLAGS  := -std=c11 -Wall -Wextra -O2 -g
SRCS    := $(wildcard src/*.c)
OBJS    := $(SRCS:.c=.o)          # src/a.c -> src/a.o

app: $(OBJS)
	$(CC) $^ -o $@                # $@ = 타겟, $^ = 모든 의존성, $< = 첫 의존성

%.o: %.c                          # 패턴 규칙: 모든 .c -> .o
	$(CC) $(CFLAGS) -c $< -o $@

.PHONY: clean                     # "clean 이라는 파일"이 아니라 항상 실행할 명령
clean:
	rm -f $(OBJS) app
```

### 자동 헤더 의존성 (실무 필수)

수동으로 `main.o: main.c util.h config.h ...` 를 관리하는 건 불가능합니다. 컴파일러가 생성:

```makefile
CFLAGS += -MMD -MP                 # 컴파일 시 .d 파일에 "이 .o 가 의존하는 헤더 목록" 기록
-include $(OBJS:.o=.d)             # 그 .d 들을 Makefile 에 포함 (첫 빌드엔 없어도 -include 라 무시)
```

이 코스의 최상위 `Makefile` 이 정확히 이 기법을 씁니다. `examples/18/Makefile` 이 작은 완성 예제.

### 병렬 빌드
```bash
make -j8                           # 8개 작업 동시에. 의존성이 정확해야 안전
```

---

## 2. Make의 한계와 CMake

Make는 훌륭하지만: 크로스 플랫폼(Windows), 라이브러리 탐색, IDE 연동, 설치 규칙을
직접 다 짜야 합니다. **CMake** 는 "빌드를 서술하면 Makefile/Ninja/VS 프로젝트를 생성"합니다.

```cmake
# CMakeLists.txt
cmake_minimum_required(VERSION 3.16)
project(myapp VERSION 1.0 LANGUAGES C)

set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)

# 라이브러리
add_library(mini STATIC src/counter.c src/strutil.c)
target_include_directories(mini PUBLIC include)

# 실행 파일
add_executable(myapp src/main.c)
target_link_libraries(myapp PRIVATE mini)

# 경고
target_compile_options(mini PRIVATE -Wall -Wextra -Wpedantic)

# 외부 라이브러리 찾기
find_package(Threads REQUIRED)
target_link_libraries(myapp PRIVATE Threads::Threads)

# 테스트
enable_testing()
add_executable(test_counter tests/test_counter.c)
target_link_libraries(test_counter PRIVATE mini)
add_test(NAME counter COMMAND test_counter)
```

```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug   # 구성 (Debug/Release/RelWithDebInfo)
cmake --build build -j                          # 빌드
ctest --test-dir build --output-on-failure      # 테스트
cmake --install build --prefix /usr/local       # 설치
```

- `CMAKE_BUILD_TYPE`: `Debug`(-g -O0), `Release`(-O3 -DNDEBUG), `RelWithDebInfo`.
- **아웃 오브 소스 빌드**: 소스와 빌드 산출물을 분리(`build/`). 항상 이렇게.
- 새니타이저: `-DCMAKE_C_FLAGS="-fsanitize=address,undefined"` 또는 커스텀 옵션.
- `compile_commands.json` 생성(`-DCMAKE_EXPORT_COMPILE_COMMANDS=ON`) → clangd/에디터가 인식.

22장 캡스톤은 `Makefile` 과 `CMakeLists.txt` 를 **둘 다** 제공합니다. 비교해 보세요.

---

## 3. `pkg-config` — 라이브러리 컴파일/링크 플래그 조회

```bash
pkg-config --cflags --libs libcurl
# -I/usr/include/x86_64-linux-gnu   -lcurl

cc myapp.c $(pkg-config --cflags --libs libcurl) -o myapp
```

CMake에선 `find_package(CURL)` 또는 `pkg_check_modules(CURL REQUIRED libcurl)`.

---

## 4. 빌드 산출물 종류 복습 (11장)

```bash
cc -c a.c                          # a.o        오브젝트
ar rcs libx.a a.o b.o              # libx.a     정적 라이브러리
cc -shared -fPIC a.o b.o -o libx.so # libx.so    동적 라이브러리 (Linux)
cc -dynamiclib a.o -o libx.dylib   # libx.dylib 동적 라이브러리 (macOS)
cc main.c -Iinclude -Llib -lx -o app
```

- `-I`: 헤더 검색 경로. `-L`: 라이브러리 검색 경로. `-l x`: `libx` 를 찾음.
- 실행 시 `.so` 탐색: `LD_LIBRARY_PATH`(Linux) / `DYLD_LIBRARY_PATH`(macOS) /
  빌드시 `-Wl,-rpath,경로` 로 박아넣기 / 시스템 경로에 설치(`ldconfig`).
- `ldd app`(Linux) / `otool -L app`(macOS): 이 실행 파일이 어떤 `.so` 를 필요로 하는지.

---

## 5. 크로스 컴파일 (개요)

다른 아키텍처용 바이너리를 만들기:

```bash
# 예: x86-64 리눅스에서 ARM 리눅스용
aarch64-linux-gnu-gcc main.c -o app-arm      # 크로스 툴체인 필요

# CMake
cmake -S . -B build-arm -DCMAKE_TOOLCHAIN_FILE=arm-toolchain.cmake
```

`toolchain.cmake` 에 `CMAKE_C_COMPILER`, `CMAKE_SYSROOT`, `CMAKE_SYSTEM_NAME` 등을 지정.
임베디드/IoT 개발의 기본기입니다.

---

## 6. 실습

1. `examples/18/` 에서 `make` → 하나의 `.c` 만 수정 → 다시 `make`. **그 파일만** 재컴파일되나요?
2. 헤더 `util.h` 를 수정하면 그걸 include한 `.c` 들이 다시 컴파일되나요? (`-MMD` 덕분)
3. `make -j4` 로 병렬 빌드하고, 일부러 의존성을 빼서 레이스를 재현해 보세요.
4. 캡스톤을 `Makefile` 로, 그다음 `cmake -S capstone -B capstone/build` 로 빌드해 비교하세요.
5. `cmake -DCMAKE_EXPORT_COMPILE_COMMANDS=ON` 후 `compile_commands.json` 을 열어 보세요.

---

## 다음 장

[19. 동시성 (pthread · atomics)](./19-동시성-pthread-atomics.md)
