# Complete File Guide

This document provides a quick reference for all files in the project with their purpose and what you'll learn.

## Documentation Files

### 📘 README.md
**Purpose**: Main project documentation
**What you'll learn**: 
- Project structure overview
- Architecture layers explanation
- API endpoints reference
- Getting started guide

### 🚀 QUICKSTART.md
**Purpose**: 10-minute quick start guide
**What you'll learn**:
- How to run the project immediately
- Basic API testing with curl
- Common troubleshooting

### 📚 LEARNING_GUIDE.md
**Purpose**: Comprehensive 6-phase learning path
**What you'll learn**:
- Structured learning progression
- Hands-on exercises for each phase
- From Go basics to production deployment

### 🏛️ ARCHITECTURE.md
**Purpose**: Visual architecture diagrams and flow
**What you'll learn**:
- Clean architecture layers
- Request/response flow
- Dependency injection pattern
- Concurrency handling

### 📊 PROJECT_SUMMARY.md
**Purpose**: High-level project overview
**What you'll learn**:
- Project statistics
- Best practices checklist
- Learning objectives

### 📁 FILES.md
**Purpose**: This file - complete file reference

---

## Source Code Files

### Entry Point

#### cmd/api/main.go (170 lines)
**Purpose**: Application entry point
**What you'll learn**:
- How to initialize a Go application
- Dependency injection in practice
- Router setup with Gin
- Middleware application order
- Server configuration

**Key concepts**:
- `package main` and `func main()`
- Dependency wiring
- Gin router groups
- API versioning

---

## Domain Layer (Business Entities)

### internal/domain/task.go (220 lines)
**Purpose**: Core business entity
**What you'll learn**:
- Struct definition with tags
- Pointer vs value receivers
- Business validation logic
- Constructor functions (NewTask)
- Domain methods

**Key concepts**:
- Structs and methods
- Exported vs unexported
- Constants for enumerations
- Business rules encapsulation

### internal/domain/errors.go (60 lines)
**Purpose**: Domain error definitions
**What you'll learn**:
- Sentinel error pattern
- Package-level error variables
- Error naming conventions

**Key concepts**:
- `errors.New()`
- Error reusability
- Domain-driven errors

---

## Repository Layer (Data Access)

### internal/repository/task_repository.go (80 lines)
**Purpose**: Repository interface definition
**What you'll learn**:
- Interface design in Go
- Contract definition
- Dependency inversion principle
- "Accept interfaces, return structs"

**Key concepts**:
- Interface methods
- Repository pattern
- CRUD operations

### internal/repository/memory/task_memory.go (230 lines)
**Purpose**: In-memory repository implementation
**What you'll learn**:
- Interface implementation (implicit)
- Concurrency safety with mutex
- Map operations in Go
- Memory-based data storage

**Key concepts**:
- `sync.RWMutex` for read/write locks
- Map initialization and usage
- Compile-time interface verification
- `defer` for cleanup

---

## Use Case Layer (Business Logic)

### internal/usecase/task_usecase.go (200 lines)
**Purpose**: Business logic orchestration
**What you'll learn**:
- Use case pattern
- Business logic organization
- Dependency injection via constructor
- Repository interface usage
- Error propagation

**Key concepts**:
- Orchestration vs domain logic
- Transaction boundaries
- Early return pattern
- Interface composition

### internal/usecase/task_usecase_test.go (250 lines)
**Purpose**: Use case unit tests
**What you'll learn**:
- Table-driven tests
- Test organization
- Mocking with in-memory repository
- AAA pattern (Arrange-Act-Assert)
- Subtests with `t.Run()`

**Key concepts**:
- `testing.T` methods
- Test isolation
- Test naming conventions
- Coverage best practices

---

## Delivery Layer (HTTP)

### internal/delivery/http/task_handler.go (260 lines)
**Purpose**: HTTP request handlers
**What you'll learn**:
- Gin handler functions
- Request binding and validation
- URL parameter extraction
- Response generation
- DTO (Data Transfer Object) pattern

**Key concepts**:
- `gin.Context` usage
- Binding tags (required, oneof)
- `c.Param()` vs `c.Query()`
- HTTP status codes
- RESTful endpoint design

### internal/delivery/http/middleware.go (180 lines)
**Purpose**: Custom middleware implementations
**What you'll learn**:
- Middleware pattern in Gin
- Request/response interception
- Logging middleware
- CORS handling
- Panic recovery
- `defer` with `recover()`

**Key concepts**:
- `gin.HandlerFunc`
- `c.Next()` vs `c.Abort()`
- Middleware chain
- Pre/post processing

### internal/delivery/http/response.go (100 lines)
**Purpose**: Response helper functions
**What you'll learn**:
- Consistent API response format
- Error mapping (domain → HTTP)
- HTTP status code selection
- JSON response structure

**Key concepts**:
- Response standardization
- Error translation
- Helper functions
- Status code semantics

---

## Configuration

### config/config.go (150 lines)
**Purpose**: Application configuration management
**What you'll learn**:
- Environment variable handling
- Configuration structs
- 12-Factor App principles
- Default values pattern

**Key concepts**:
- `os.Getenv()`
- Type conversion
- Configuration validation
- Environment-based config

---

## Utilities

### pkg/logger/logger.go (60 lines)
**Purpose**: Logging utility
**What you'll learn**:
- Logger wrapper pattern
- Log levels
- Variadic functions

**Key concepts**:
- Reusable packages
- Interface wrapping
- Formatted output

---

## Project Configuration

### go.mod
**Purpose**: Go module definition
**What you'll learn**:
- Go module system
- Dependency management
- Version specifications

**Key concepts**:
- `go mod` commands
- Semantic versioning
- Direct vs indirect dependencies

### .gitignore
**Purpose**: Git exclusion rules
**What you'll learn**:
- What to exclude from version control
- Go-specific exclusions

### Makefile
**Purpose**: Development automation
**What you'll learn**:
- Common development tasks
- Build automation
- Testing shortcuts

---

## File Reading Order (Recommended)

### Beginner Path
1. README.md - Understand the big picture
2. QUICKSTART.md - Get it running
3. internal/domain/task.go - Start with domain
4. internal/repository/task_repository.go - Interface concept
5. internal/repository/memory/task_memory.go - Implementation
6. internal/usecase/task_usecase.go - Business logic
7. internal/delivery/http/task_handler.go - HTTP layer
8. cmd/api/main.go - How it all comes together

### Architecture-Focused Path
1. ARCHITECTURE.md - Visual overview
2. internal/domain/ - Core entities
3. internal/repository/ - Data abstraction
4. internal/usecase/ - Business logic
5. internal/delivery/ - HTTP layer
6. cmd/api/main.go - Dependency wiring

### Testing-Focused Path
1. internal/usecase/task_usecase_test.go - Learn testing
2. internal/usecase/task_usecase.go - Understand what's tested
3. LEARNING_GUIDE.md Phase 4 - Testing exercises

---

## Lines of Code Summary

```
Documentation:
  README.md                      400 lines
  QUICKSTART.md                  150 lines
  LEARNING_GUIDE.md              600 lines
  ARCHITECTURE.md                450 lines
  PROJECT_SUMMARY.md             450 lines
  FILES.md (this file)           ~300 lines

Source Code:
  cmd/api/main.go                170 lines
  internal/domain/task.go        220 lines
  internal/domain/errors.go       60 lines
  internal/repository/task_repository.go  80 lines
  internal/repository/memory/task_memory.go  230 lines
  internal/usecase/task_usecase.go  200 lines
  internal/usecase/task_usecase_test.go  250 lines
  internal/delivery/http/task_handler.go  260 lines
  internal/delivery/http/middleware.go  180 lines
  internal/delivery/http/response.go  100 lines
  config/config.go               150 lines
  pkg/logger/logger.go            60 lines

Total Documentation: ~2,350 lines
Total Source Code: ~1,960 lines
Documentation/Code Ratio: 1.2:1 (highly documented!)
```

---

## What Each File Teaches

| File | Primary Learning Focus |
|------|----------------------|
| task.go | Structs, methods, business rules |
| errors.go | Error handling patterns |
| task_repository.go | Interface design |
| task_memory.go | Concurrency, maps, implementation |
| task_usecase.go | Business logic organization |
| task_usecase_test.go | Testing patterns |
| task_handler.go | Gin framework, HTTP handling |
| middleware.go | Middleware pattern |
| response.go | Response standardization |
| config.go | Configuration management |
| logger.go | Utility packages |
| main.go | Application structure, DI |

---

Happy learning! Start with README.md and follow the recommended reading order.
