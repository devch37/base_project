# examples/18/proj/Makefile — 증분 빌드 + 자동 헤더 의존성의 최소 완성 예제
#
#   make            빌드
#   make run        빌드 후 실행
#   touch src/mathx.c && make   -> mathx.c 만 재컴파일되는지 관찰
#   touch include/mathx.h && make -> 그 헤더를 쓰는 .c 들이 재컴파일되는지 관찰 (-MMD 덕분)
#   make -j4        병렬 빌드
#   make clean

CC      := cc
CFLAGS  := -std=c11 -Wall -Wextra -Wpedantic -O2 -g -Iinclude -MMD -MP
LDFLAGS :=

SRCS := $(wildcard src/*.c)
OBJS := $(SRCS:.c=.o)
DEPS := $(OBJS:.o=.d)
BIN  := app

.PHONY: all run clean
all: $(BIN)

$(BIN): $(OBJS)
	$(CC) $(LDFLAGS) $^ -o $@
	@echo "빌드 완료: ./$(BIN)"

# 패턴 규칙: 모든 src/%.c -> src/%.o.  $< = 첫 의존성, $@ = 타겟
%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

run: $(BIN)
	./$(BIN) 48 60

clean:
	rm -f $(OBJS) $(DEPS) $(BIN)

# 컴파일러가 생성한 헤더 의존성 파일을 포함 (첫 빌드엔 없으므로 - 로 무시)
-include $(DEPS)
