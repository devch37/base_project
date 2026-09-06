# capstone/CMakeLists.txt  (18장 참고)
#   cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
#   cmake --build build -j
#   ctest --test-dir build --output-on-failure
#   ./build/kv set name alice
cmake_minimum_required(VERSION 3.16)
project(kvstore VERSION 1.0 LANGUAGES C)

set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE RelWithDebInfo)
endif()

add_library(kvstore STATIC src/kvstore.c)
target_include_directories(kvstore PUBLIC include)
target_compile_options(kvstore PRIVATE -Wall -Wextra -Wpedantic -Wshadow)

add_executable(kv src/main.c)
target_link_libraries(kv PRIVATE kvstore)

enable_testing()
add_executable(test_kvstore tests/test_kvstore.c)
target_link_libraries(test_kvstore PRIVATE kvstore)
add_test(NAME kvstore COMMAND test_kvstore)

# 선택: 새니타이저 빌드
option(KV_SANITIZE "Build with ASan/UBSan" OFF)
if(KV_SANITIZE)
  target_compile_options(kvstore PRIVATE -fsanitize=address,undefined)
  target_link_options(kvstore PUBLIC -fsanitize=address,undefined)
endif()
