package com.example.postgrestutorial.message;

import java.time.OffsetDateTime;

public record Message(
        long id,
        String code,
        String content,
        OffsetDateTime createdAt
) {
}
