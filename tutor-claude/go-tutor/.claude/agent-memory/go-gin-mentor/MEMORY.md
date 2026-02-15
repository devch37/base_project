# Go-Gin Mentor Memory

## Project Created
- Comprehensive Go + Gin + Clean Architecture tutorial project
- Domain: Task Management API (CRUD operations)
- Target: Go beginners learning clean architecture

## Architecture Patterns Established

### Clean Architecture Layers
1. **Domain** (`internal/domain/`) - Business entities, no external dependencies
2. **Repository** (`internal/repository/`) - Data access interfaces + implementations
3. **UseCase** (`internal/usecase/`) - Business logic orchestration
4. **Delivery** (`internal/delivery/http/`) - HTTP handlers (Gin framework)

### Key Go Patterns Demonstrated
- Dependency Injection via constructors
- Interface-based design (Accept interfaces, return structs)
- Sentinel errors pattern (package-level error variables)
- Table-driven tests
- Pointer vs value receivers
- Struct tags for JSON binding

### Gin Framework Patterns
- Middleware chain (Recovery → Logger → CORS)
- Request binding with validation tags
- Router grouping for API versioning
- Consistent response format
- Domain error to HTTP status mapping

## File Structure Created
```
cmd/api/main.go           - Entry point, dependency wiring
internal/
  domain/                 - Business entities
  repository/             - Data access abstraction
  usecase/                - Business logic
  delivery/http/          - HTTP layer
config/                   - Configuration management
pkg/logger/               - Reusable utilities
```

## Learning Resources Created
- README.md - Project overview and quick reference
- LEARNING_GUIDE.md - Phased learning path (6 phases)
- QUICKSTART.md - 10-minute getting started guide

## Korean Teaching Style
- Bilingual comments (English + Korean)
- Explanations of "why" not just "what"
- Common mistakes highlighted
- Production vs learning trade-offs noted

## Testing Approach
- Unit tests for UseCase layer
- Table-driven test examples
- Mock repository pattern demonstrated
- AAA pattern (Arrange-Act-Assert)

## Next Extension Points
1. PostgreSQL repository implementation
2. JWT authentication middleware
3. Structured logging (zerolog/zap)
4. Docker containerization
5. Graceful shutdown
6. Database migrations
