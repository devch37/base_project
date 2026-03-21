# SQL Tutor

Practice-ready SQL project with a realistic e-commerce + analytics schema, dummy data, and a large set of queries from basic to advanced. The goal is to build mastery over joins, aggregation, window functions, CTEs, and analytical patterns used in production.

## Target DB

The schema is written for **MySQL 8.0+**.

## Files

- `schema.sql` - DDL for all tables, constraints, and indexes (MySQL)
- `seed.sql` - small but coherent dummy data
- `problems.sql` - exercises only (no answers)
- `answers.sql` - best-practice solutions

## How To Run (MySQL)

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS sql_tutor;"
mysql -u root -p sql_tutor < schema.sql
mysql -u root -p sql_tutor < seed.sql
```

## What You Will Practice

- Basic SELECT, WHERE, GROUP BY
- Multi-table joins (1:N, N:M)
- Aggregations and HAVING
- CTEs and recursive CTEs
- Window functions (rank, lag/lead, moving averages)
- Time-series and cohort analysis
- Funnel and retention queries
- RFM segmentation
- Outlier detection and data quality checks
- Query optimization patterns (indexes, pre-aggregation)

## Notes

- Use `problems.sql` to practice first, then check `answers.sql` for reference solutions.
- Some advanced queries will be slow without indexes; those indexes are included in `schema.sql`.
