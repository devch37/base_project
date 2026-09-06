/* serialize.h — 엔디언 무관 정수 직렬화 + CRC32 (16장 참고) */
#ifndef KV_SERIALIZE_H
#define KV_SERIALIZE_H

#include <stddef.h>
#include <stdint.h>

static inline void put_u32_be(unsigned char *p, uint32_t v) {
    p[0] = (unsigned char)(v >> 24);
    p[1] = (unsigned char)(v >> 16);
    p[2] = (unsigned char)(v >> 8);
    p[3] = (unsigned char)(v);
}

static inline uint32_t get_u32_be(const unsigned char *p) {
    return (uint32_t)p[0] << 24 | (uint32_t)p[1] << 16 | (uint32_t)p[2] << 8 | (uint32_t)p[3];
}

/* CRC32 (IEEE, 반사 다항식 0xEDB88320). 테이블 없이 계산 — 짧고 이식성 좋음. */
static inline uint32_t crc32_update(uint32_t crc, const void *buf, size_t len) {
    const unsigned char *p = buf;
    crc = ~crc;
    for (size_t i = 0; i < len; i++) {
        crc ^= p[i];
        for (int k = 0; k < 8; k++) {
            uint32_t mask = (uint32_t)-(int32_t)(crc & 1u);
            crc = (crc >> 1) ^ (0xEDB88320u & mask);
        }
    }
    return ~crc;
}

static inline uint32_t crc32(const void *buf, size_t len) { return crc32_update(0, buf, len); }

#endif /* KV_SERIALIZE_H */
