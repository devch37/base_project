# SQL Tutor

Practice-ready SQL project with a realistic e-commerce + analytics schema, dummy data, and a large set of queries from basic to advanced. The goal is to build mastery over joins, aggregation, window functions, CTEs, and analytical patterns used in production.

## Target DB

The schema is written for PostgreSQL 14+ (works on most modern versions).

## Files

- `schema.sql` - DDL for all tables, constraints, and indexes
- `seed.sql` - small but coherent dummy data
- `queries.sql` - basic to advanced exercises

## How To Run (Postgres)

```bash
psql -d sql_tutor -f schema.sql
psql -d sql_tutor -f seed.sql
psql -d sql_tutor -f queries.sql
```

## What You Will Practice

- Basic SELECT, WHERE, GROUP BY
- Multi-table joins (1:N, N:M)
- Aggregations and HAVING
- CTEs and recursive CTEs
- Window functions (rank, lag/lead, percentiles)
- Time-series and cohort analysis
- Funnel and retention queries
- RFM segmentation
- Outlier detection and data quality checks
- Query optimization patterns (indexes, pre-aggregation)

## Notes

- All queries are production-style and intentionally complex.
- Read the comments in `queries.sql` to understand intent and tradeoffs.
- Some advanced queries will be slow without indexes; those indexes are included in `schema.sql`.
