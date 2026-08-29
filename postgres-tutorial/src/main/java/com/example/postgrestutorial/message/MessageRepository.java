package com.example.postgrestutorial.message;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class MessageRepository {

    private static final RowMapper<Message> MESSAGE_ROW_MAPPER = MessageRepository::mapMessage;

    private final JdbcTemplate jdbcTemplate;

    public MessageRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Message> findAll() {
        return jdbcTemplate.query("""
                SELECT id, code, content, created_at
                FROM sample_message
                ORDER BY id
                """, MESSAGE_ROW_MAPPER);
    }

    public Optional<Message> findById(long id) {
        return jdbcTemplate.query("""
                        SELECT id, code, content, created_at
                        FROM sample_message
                        WHERE id = ?
                        """, MESSAGE_ROW_MAPPER, id)
                .stream()
                .findFirst();
    }

    public Message save(CreateMessageRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            var statement = connection.prepareStatement("""
                    INSERT INTO sample_message (code, content)
                    VALUES (?, ?)
                    """, new String[]{"id"});
            statement.setString(1, request.code());
            statement.setString(2, request.content());
            return statement;
        }, keyHolder);

        Number id = keyHolder.getKey();
        if (id == null) {
            throw new IllegalStateException("PostgreSQL에서 생성된 ID를 반환받지 못했습니다.");
        }

        return findById(id.longValue())
                .orElseThrow(() -> new IllegalStateException("저장한 메시지를 조회하지 못했습니다."));
    }

    private static Message mapMessage(ResultSet resultSet, int rowNumber) throws SQLException {
        return new Message(
                resultSet.getLong("id"),
                resultSet.getString("code"),
                resultSet.getString("content"),
                resultSet.getObject("created_at", java.time.OffsetDateTime.class)
        );
    }
}
