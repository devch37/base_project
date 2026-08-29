package com.example.postgrestutorial.message;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.OffsetDateTime;

import org.junit.jupiter.api.Test;

class MessageTest {

    @Test
    void messageKeepsDatabaseValues() {
        OffsetDateTime createdAt = OffsetDateTime.parse("2026-01-01T00:00:00+09:00");

        Message message = new Message(1L, "HELLO", "테스트", createdAt);

        assertThat(message.code()).isEqualTo("HELLO");
        assertThat(message.createdAt()).isEqualTo(createdAt);
    }
}
