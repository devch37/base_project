# 같은 프로젝트를 CMake 로.  (18장 참고)
#   cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
#   cmake --build build -j
#   ./build/app 48 60
cmake_minimum_required(VERSION 3.16)
project(mathx C)

set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

add_library(mathx STATIC src/mathx.c)
target_include_directories(mathx PUBLIC include)
target_compile_options(mathx PRIVATE -Wall -Wextra -Wpedantic)

add_executable(app src/main.c)
target_link_libraries(app PRIVATE mathx)
