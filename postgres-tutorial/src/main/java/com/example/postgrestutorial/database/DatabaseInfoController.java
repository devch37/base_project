package com.example.postgrestutorial.database;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/database")
public class DatabaseInfoController {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseInfoController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/info")
    public Map<String, Object> info() {
        return jdbcTemplate.queryForObject("""
                SELECT current_database() AS database_name,
                       current_user AS user_name,
                       current_schema() AS schema_name,
                       version() AS postgres_version,
                       inet_server_addr()::text AS server_address,
                       inet_server_port() AS server_port
                """, (resultSet, rowNumber) -> {
            Map<String, Object> info = new LinkedHashMap<>();
            info.put("database", resultSet.getString("database_name"));
            info.put("user", resultSet.getString("user_name"));
            info.put("schema", resultSet.getString("schema_name"));
            info.put("version", resultSet.getString("postgres_version"));
            info.put("serverAddress", resultSet.getString("server_address"));
            info.put("serverPort", resultSet.getObject("server_port"));
            return info;
        });
    }
}
