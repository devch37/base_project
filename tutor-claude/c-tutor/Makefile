# c-tutor 예제 빌드용 Makefile
# ---------------------------------------------------------------------------
# examples/NN/ 아래의 각 .c 파일을 bin/ 아래 실행 파일 하나로 컴파일합니다.
# (11장만 예외: 여러 .c를 하나로 링크하는 "다중 파일" 데모라서 따로 처리)
#
# 자주 쓰는 명령:
#   make              모든 예제 빌드
#   make list         만들어진 실행 파일 목록
#   make run NAME=01_hello       해당 예제 실행
#   make asan NAME=08_leak       AddressSanitizer 켜고 빌드+실행
#   make ubsan NAME=16_overflow  UBSanitizer 켜고 빌드+실행
#   make 06           examples/06/ 예제만 다시 빌드
#   make clean
# ---------------------------------------------------------------------------

CC      ?= cc
# -std=c11    : C11 표준 (16, 21장에서 표준 버전별 차이를 다룹니다)
# -Wall -Wextra -Wpedantic : 실무에서 켜야 하는 기본 경고 3종 세트
# -Wshadow    : 바깥 변수를 가리는 지역 변수 경고 (버그의 흔한 원인)
# -Wconversion: 암묵적 형 변환으로 값이 깎이는 경우 경고 (2장)
# -g          : 디버그 정보 (17장 gdb/lldb에서 필요)
# -MMD -MP    : 헤더 변경 시 자동 재컴파일용 의존성 파일 생성 (18장에서 설명)
# -Wno-sign-conversion : 비트 플래그(unsigned ^= enum) 같은 관용 코드의 소음을 끔.
#   실무에서 부호 변환까지 잡고 싶으면 -Wsign-conversion 을 별도로 켜세요(2장).
CFLAGS  ?= -std=c11 -Wall -Wextra -Wpedantic -Wshadow -Wconversion -Wno-sign-conversion -g -MMD -MP
LDFLAGS ?=
LDLIBS  ?=

# 19장 예제는 pthread가 필요합니다.
THREAD_LIBS := -lpthread

BIN := bin
SRC_DIRS := $(sort $(wildcard examples/*/))

# 11장(다중 파일)과 18장(자체 Makefile 프로젝트)은 최상위 자동 빌드에서 제외
ALL_SRC     := $(wildcard examples/*/*.c)
MULTI_SRC   := $(wildcard examples/11/*.c)
CH18_SRC    := $(wildcard examples/18/proj/*.c)
SINGLE_SRC  := $(filter-out $(MULTI_SRC) $(CH18_SRC),$(ALL_SRC))

# examples/03/03_bits.c -> bin/03_bits
SINGLE_BIN  := $(patsubst %.c,$(BIN)/%,$(notdir $(SINGLE_SRC)))
MULTI_BIN   := $(if $(MULTI_SRC),$(BIN)/11_multifile)

DEPS := $(wildcard $(BIN)/*.d)

.PHONY: all list clean run asan ubsan leaks valgrind help
.PHONY: 00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21

all: $(SINGLE_BIN) $(MULTI_BIN)
	@echo ""
	@echo "빌드 완료. 'make list' 로 실행 파일을 확인하세요."

help:
	@sed -n '1,25p' Makefile

# --- 단일 파일 예제 ---------------------------------------------------------
# VPATH 로 모든 examples 하위 폴더에서 소스를 찾게 함
VPATH := $(SRC_DIRS)

$(BIN):
	@mkdir -p $(BIN)

$(BIN)/%: %.c | $(BIN)
	$(CC) $(CFLAGS) $(LDFLAGS) $< $(LDLIBS) -o $@

# 19장 스레드 예제는 -lpthread 를 붙여야 함
$(BIN)/19_%: examples/19/19_%.c | $(BIN)
	$(CC) $(CFLAGS) $(LDFLAGS) $< $(LDLIBS) $(THREAD_LIBS) -o $@

# --- 11장 다중 파일 예제 ---------------------------------------------------
ifneq ($(MULTI_SRC),)
$(BIN)/11_multifile: $(MULTI_SRC) | $(BIN)
	$(CC) $(CFLAGS) $(LDFLAGS) -Iexamples/11 $(MULTI_SRC) $(LDLIBS) -o $@
endif

# --- 챕터 단위 빌드 (make 06 등) ------------------------------------------
define CHAPTER_RULE
$(1):
	@$$(MAKE) --no-print-directory $$(patsubst %.c,$$(BIN)/%,$$(notdir $$(wildcard examples/$(1)/*.c)))
endef
$(foreach n,00 01 02 03 04 05 06 07 08 09 10 12 13 14 15 16 17 19 20 21,$(eval $(call CHAPTER_RULE,$(n))))
11: $(BIN)/11_multifile
18:
	@$(MAKE) --no-print-directory -C examples/18/proj

# --- 편의 타겟 -----------------------------------------------------------
list: all
	@ls -1 $(BIN) | grep -Ev '\.(d|dSYM)$$' | sed 's/^/  bin\//'

run:
	@test -n "$(NAME)" || { echo "사용법: make run NAME=01_hello"; exit 1; }
	@$(MAKE) --no-print-directory $(BIN)/$(NAME)
	@echo "--- ./$(BIN)/$(NAME) ---"
	@./$(BIN)/$(NAME)

# AddressSanitizer + UBSan: 버퍼 오버플로우, use-after-free, double free 등 (8, 17장)
#   누수(leak) 탐지: Linux 에선 ASan 이 자동으로 함. macOS(Apple clang)는 LeakSanitizer
#   미지원 → 'make leaks NAME=...' (Xcode의 leaks 도구)를 쓰세요.
asan:
	@test -n "$(NAME)" || { echo "사용법: make asan NAME=08_bugs"; exit 1; }
	$(CC) $(CFLAGS) -fsanitize=address,undefined -fno-omit-frame-pointer \
		$(firstword $(wildcard examples/*/$(NAME).c)) -o $(BIN)/$(NAME)_asan
	@echo "--- ./$(BIN)/$(NAME)_asan ---"
	@./$(BIN)/$(NAME)_asan || true

# macOS 누수 탐지 (Xcode 포함). Linux 라면 'make valgrind NAME=...' 참고.
leaks:
	@test -n "$(NAME)" || { echo "사용법: make leaks NAME=15_demo"; exit 1; }
	$(CC) $(CFLAGS) $(firstword $(wildcard examples/*/$(NAME).c)) -o $(BIN)/$(NAME)
	MallocStackLogging=1 leaks --atExit -- ./$(BIN)/$(NAME) || true

valgrind:
	@test -n "$(NAME)" || { echo "사용법: make valgrind NAME=15_demo"; exit 1; }
	$(CC) $(CFLAGS) $(firstword $(wildcard examples/*/$(NAME).c)) -o $(BIN)/$(NAME)
	valgrind --leak-check=full --error-exitcode=1 ./$(BIN)/$(NAME) || true

# UndefinedBehaviorSanitizer 단독 (16장)
ubsan:
	@test -n "$(NAME)" || { echo "사용법: make ubsan NAME=16_ub_overflow"; exit 1; }
	$(CC) $(CFLAGS) -fsanitize=undefined -fno-sanitize-recover=all \
		$(firstword $(wildcard examples/*/$(NAME).c)) -o $(BIN)/$(NAME)_ubsan
	@echo "--- ./$(BIN)/$(NAME)_ubsan ---"
	@./$(BIN)/$(NAME)_ubsan || true

clean:
	rm -rf $(BIN)

-include $(DEPS)
