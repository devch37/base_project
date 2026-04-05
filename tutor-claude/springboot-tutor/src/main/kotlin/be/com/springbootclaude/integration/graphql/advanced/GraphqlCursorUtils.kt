package be.com.springbootclaude.integration.graphql.advanced

import java.time.LocalDateTime
import java.util.Base64

/**
 * Cursor 유틸리티
 *
 * 커서 포맷: base64Url("{createdAtISO}|{id}")
 */
object GraphqlCursorUtils {

    data class Cursor(val createdAt: LocalDateTime, val id: Long)

    fun encode(createdAt: LocalDateTime, id: Long): String {
        val raw = "${createdAt}|${id}"
        return Base64.getUrlEncoder().encodeToString(raw.toByteArray())
    }

    fun decode(cursor: String): Cursor {
        val decoded = runCatching {
            String(Base64.getUrlDecoder().decode(cursor))
        }.getOrElse { throw IllegalArgumentException("cursor 디코딩 실패") }

        val parts = decoded.split("|")
        if (parts.size != 2) {
            throw IllegalArgumentException("cursor 포맷이 올바르지 않습니다")
        }

        val createdAt = runCatching { LocalDateTime.parse(parts[0]) }
            .getOrElse { throw IllegalArgumentException("cursor 날짜 포맷 오류") }
        val id = parts[1].toLongOrNull()
            ?: throw IllegalArgumentException("cursor id 포맷 오류")

        return Cursor(createdAt, id)
    }
}
