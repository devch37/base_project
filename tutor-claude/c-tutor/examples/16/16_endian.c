/*
 * 16_endian.c — 이 기계의 엔디언 확인 + 엔디언 무관 직렬화
 *   make run NAME=16_endian
 */
#include <stdint.h>
#include <stdio.h>
#include <string.h>

/* 엔디언 무관, 이식성 100%: 시프트와 마스크로 바이트를 명시적으로 배치 */
static void put_u32_be(unsigned char *p, uint32_t v) {
    p[0] = (unsigned char)(v >> 24);
    p[1] = (unsigned char)(v >> 16);
    p[2] = (unsigned char)(v >> 8);
    p[3] = (unsigned char)(v);
}
static uint32_t get_u32_be(const unsigned char *p) {
    return (uint32_t)p[0] << 24 | (uint32_t)p[1] << 16 | (uint32_t)p[2] << 8 | (uint32_t)p[3];
}

int main(void) {
    uint32_t v = 0x11223344;
    unsigned char raw[4];
    memcpy(raw, &v, 4); /* 이 기계의 네이티브 저장 순서 */

    printf("0x11223344 를 메모리에 저장하면: %02X %02X %02X %02X\n",
           raw[0], raw[1], raw[2], raw[3]);
    printf("=> 이 기계는 %s 엔디언\n\n",
           raw[0] == 0x44 ? "리틀(little)" : raw[0] == 0x11 ? "빅(big)" : "이상한");

    unsigned char wire[4];
    put_u32_be(wire, v);
    printf("BE 직렬화 결과 (어느 기계든 동일): %02X %02X %02X %02X\n",
           wire[0], wire[1], wire[2], wire[3]);
    printf("역직렬화: 0x%08X  %s\n", get_u32_be(wire),
           get_u32_be(wire) == v ? "(왕복 성공)" : "(실패)");

    printf("\n교훈: 파일/네트워크엔 구조체를 통째로 쓰지 말고 바이트 단위로 직렬화하라.\n");
    return 0;
}
