INSERT INTO sample_message (code, content)
VALUES
    ('HELLO', 'PostgreSQL 연결 테스트 메시지입니다.'),
    ('SPRING', 'Spring Boot JdbcTemplate 예제입니다.'),
    ('DOCKER', '로컬 Docker PostgreSQL에서 생성된 데이터입니다.')
ON CONFLICT (code) DO NOTHING;
