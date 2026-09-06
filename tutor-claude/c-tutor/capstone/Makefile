# capstone/Makefile — 미니 KV 저장소
#
#   make            빌드 (bin/kv)
#   make run        예시 실행
#   make test       단위 테스트
#   make asan       새니타이저로 테스트
#   make clean

CC      := cc
CFLAGS  := -std=c11 -Wall -Wextra -Wpedantic -Wshadow -Wconversion -Wno-sign-conversion -O2 -g \
           -Iinclude -MMD -MP
LDFLAGS :=

BIN     := bin
LIB_SRC := src/kvstore.c
CLI_SRC := src/main.c
TEST_SRC := tests/test_kvstore.c

.PHONY: all run test asan clean
all: $(BIN)/kv

$(BIN):
	@mkdir -p $(BIN)

$(BIN)/kv: $(LIB_SRC) $(CLI_SRC) | $(BIN)
	$(CC) $(CFLAGS) $(LDFLAGS) $^ -o $@
	@echo "빌드 완료: ./$(BIN)/kv"

$(BIN)/test: $(LIB_SRC) $(TEST_SRC) | $(BIN)
	$(CC) $(CFLAGS) $(LDFLAGS) $^ -o $@

run: $(BIN)/kv
	@rm -f demo.db
	./$(BIN)/kv -f demo.db set name alice
	./$(BIN)/kv -f demo.db set lang C
	./$(BIN)/kv -f demo.db get name
	./$(BIN)/kv -f demo.db list
	./$(BIN)/kv -f demo.db del lang
	./$(BIN)/kv -f demo.db compact
	@rm -f demo.db

test: $(BIN)/test
	./$(BIN)/test

asan: $(LIB_SRC) $(TEST_SRC) | $(BIN)
	$(CC) $(CFLAGS) -fsanitize=address,undefined -fno-omit-frame-pointer $(LIB_SRC) $(TEST_SRC) -o $(BIN)/test_asan
	./$(BIN)/test_asan

clean:
	rm -rf $(BIN) *.db *.db.tmp

-include $(BIN)/*.d
