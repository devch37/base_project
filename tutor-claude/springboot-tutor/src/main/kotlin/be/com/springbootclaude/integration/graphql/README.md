# GraphQL 학습 가이드 (basic ~ advanced)

## 패키지 구조

- `integration/graphql/basic`
  - `GraphqlQueryController`: Query Resolver
  - `GraphqlMutationController`: Mutation Resolver
  - `GraphqlArticleQueryService`: GraphQL 전용 조회 서비스
  - `GraphqlUserQueryService`: 사용자 조회 서비스
  - `CreateArticleInput`: 입력 타입

- `integration/graphql/advanced`
  - `GraphqlAuthorBatchResolver`: N+1 해결용 Batch Mapping
  - `GraphqlExceptionResolver`: 예외 -> GraphQL 에러 매핑
  - `GraphqlScalarConfig`: Long 스칼라 등록

- `integration/graphql/shared`
  - GraphQL 전용 DTO와 PageInfo

## 실무 베스트 프랙티스 요약

- Query/Mutation 분리
- REST DTO와 GraphQL DTO 분리
- N+1 문제 해결을 위한 Batch Mapping
- 에러 응답 표준화 (extensions 활용)
- 스키마 중심 개발 (schema.graphqls)

## 빠른 테스트 (예시)

- GraphQL Endpoint: `http://localhost:8080/graphql`
- GraphiQL UI: `http://localhost:8080/graphiql`

```graphql
query {
  publishedArticles(page: 0, size: 5) {
    content {
      id
      title
      author { name }
    }
    pageInfo { page size totalElements hasNext }
  }
}

mutation {
  createArticle(input: { authorId: 1, title: "GraphQL", content: "hello" }) {
    article { id title status }
    message
  }
}
```

### 고급 페이징 + 필터 예시

```graphql
query {
  searchArticlesAdvanced(
    filter: {
      status: PUBLISHED
      keyword: "spring"
      authorId: 1
      from: "2026-03-01T00:00:00"
      to: "2026-03-31T23:59:59"
    }
    page: 0
    size: 10
  ) {
    content {
      id
      title
      status
      author { id name }
    }
    pageInfo { page size totalElements totalPages hasNext }
  }
}
```

### Cursor 기반 페이징 예시

```graphql
query {
  publishedArticlesCursor(input: { size: 3 }) {
    edges {
      cursor
      node { id title createdAt }
    }
    pageInfo { endCursor hasNext }
  }
}
```

```graphql
query {
  publishedArticlesCursor(input: { after: "END_CURSOR", size: 3 }) {
    edges {
      cursor
      node { id title createdAt }
    }
    pageInfo { endCursor hasNext }
  }
}
```

### DataLoader 예시

```graphql
query {
  publishedArticles(page: 0, size: 5) {
    content {
      id
      title
      authorViaLoader { id name }
    }
  }
}
```
