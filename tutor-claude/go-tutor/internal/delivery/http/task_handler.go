package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/go-tutor/internal/usecase"
)

// TaskHandler handles HTTP requests for task operations
// Task HTTP 핸들러: HTTP 요청을 UseCase 호출로 변환
//
// Delivery Layer의 역할:
// - HTTP 요청 파싱
// - 입력 검증
// - UseCase 호출
// - HTTP 응답 생성
//
// 주의: 비즈니스 로직은 포함하지 않음!
type TaskHandler struct {
	usecase *usecase.TaskUseCase
}

// NewTaskHandler creates a new task handler
// 생성자 함수: Dependency Injection
func NewTaskHandler(uc *usecase.TaskUseCase) *TaskHandler {
	return &TaskHandler{
		usecase: uc,
	}
}

// CreateTaskRequest represents the request body for creating a task
// Task 생성 요청 DTO (Data Transfer Object)
//
// Binding Tags:
// - json: JSON 필드명 매핑
// - binding: 검증 규칙
//   - required: 필수 필드
//   - oneof: 열거형 값 검증
type CreateTaskRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Status      string `json:"status" binding:"omitempty,oneof=pending in_progress completed"`
}

// UpdateTaskRequest represents the request body for updating a task
// Task 업데이트 요청 DTO
type UpdateTaskRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status" binding:"omitempty,oneof=pending in_progress completed"`
}

// CreateTask handles POST /tasks
// Task 생성 핸들러
//
// Gin Handler 시그니처: func(c *gin.Context)
// - c: Gin Context (요청/응답 정보 포함)
//
// @Summary Create a new task
// @Description Create a new task with title, description, and status
// @Tags tasks
// @Accept json
// @Produce json
// @Param task body CreateTaskRequest true "Task object"
// @Success 201 {object} Response
// @Failure 400 {object} Response
// @Router /tasks [post]
func (h *TaskHandler) CreateTask(c *gin.Context) {
	// 1. 요청 바인딩 및 검증
	var req CreateTaskRequest

	// ShouldBindJSON:
	// - JSON 요청 본문을 구조체로 파싱
	// - binding 태그에 따라 자동 검증
	// - 검증 실패 시 에러 반환
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondValidationError(c, err)
		return
	}

	// 2. UseCase 호출
	// HTTP 레이어는 비즈니스 로직을 모름
	// UseCase에 모든 비즈니스 로직 위임
	task, err := h.usecase.CreateTask(req.Title, req.Description, req.Status)
	if err != nil {
		RespondError(c, err)
		return
	}

	// 3. 성공 응답
	// 201 Created: 리소스 생성 성공
	RespondSuccess(c, http.StatusCreated, "Task created successfully", task)
}

// GetAllTasks handles GET /tasks
// 모든 Task 조회 핸들러
//
// @Summary Get all tasks
// @Description Get a list of all tasks
// @Tags tasks
// @Produce json
// @Success 200 {object} Response
// @Router /tasks [get]
func (h *TaskHandler) GetAllTasks(c *gin.Context) {
	// Query Parameter 처리 예시 (선택적)
	// status := c.Query("status")  // ?status=pending
	// if status != "" {
	//     tasks, err := h.usecase.GetTasksByStatus(status)
	//     // ...
	// }

	// 모든 task 조회
	tasks, err := h.usecase.GetAllTasks()
	if err != nil {
		RespondError(c, err)
		return
	}

	RespondSuccess(c, http.StatusOK, "Tasks retrieved successfully", tasks)
}

// GetTaskByID handles GET /tasks/:id
// ID로 Task 조회 핸들러
//
// URL Parameter 사용:
// - /tasks/:id에서 :id는 URL 파라미터
// - c.Param("id")로 추출
//
// @Summary Get a task by ID
// @Description Get a task by its ID
// @Tags tasks
// @Produce json
// @Param id path int true "Task ID"
// @Success 200 {object} Response
// @Failure 404 {object} Response
// @Router /tasks/{id} [get]
func (h *TaskHandler) GetTaskByID(c *gin.Context) {
	// 1. URL 파라미터 추출 및 변환
	// c.Param("id")는 string을 반환
	// uint로 변환 필요
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		RespondValidationError(c, err)
		return
	}

	// 2. UseCase 호출
	task, err := h.usecase.GetTaskByID(uint(id))
	if err != nil {
		RespondError(c, err)
		return
	}

	// 3. 성공 응답
	RespondSuccess(c, http.StatusOK, "Task retrieved successfully", task)
}

// UpdateTask handles PUT /tasks/:id
// Task 업데이트 핸들러
//
// PUT vs PATCH:
// - PUT: 전체 리소스 교체
// - PATCH: 부분 업데이트
// 현재는 PUT 사용하지만 부분 업데이트 허용
//
// @Summary Update a task
// @Description Update a task by its ID
// @Tags tasks
// @Accept json
// @Produce json
// @Param id path int true "Task ID"
// @Param task body UpdateTaskRequest true "Task object"
// @Success 200 {object} Response
// @Failure 400 {object} Response
// @Failure 404 {object} Response
// @Router /tasks/{id} [put]
func (h *TaskHandler) UpdateTask(c *gin.Context) {
	// 1. URL 파라미터 추출
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		RespondValidationError(c, err)
		return
	}

	// 2. 요청 바인딩
	var req UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondValidationError(c, err)
		return
	}

	// 3. UseCase 호출
	task, err := h.usecase.UpdateTask(uint(id), req.Title, req.Description, req.Status)
	if err != nil {
		RespondError(c, err)
		return
	}

	// 4. 성공 응답
	RespondSuccess(c, http.StatusOK, "Task updated successfully", task)
}

// DeleteTask handles DELETE /tasks/:id
// Task 삭제 핸들러
//
// @Summary Delete a task
// @Description Delete a task by its ID
// @Tags tasks
// @Produce json
// @Param id path int true "Task ID"
// @Success 200 {object} Response
// @Failure 404 {object} Response
// @Router /tasks/{id} [delete]
func (h *TaskHandler) DeleteTask(c *gin.Context) {
	// 1. URL 파라미터 추출
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		RespondValidationError(c, err)
		return
	}

	// 2. UseCase 호출
	if err := h.usecase.DeleteTask(uint(id)); err != nil {
		RespondError(c, err)
		return
	}

	// 3. 성공 응답
	// 삭제 성공 시 data는 없을 수 있음
	RespondSuccess(c, http.StatusOK, "Task deleted successfully", nil)
}

// MarkTaskAsCompleted handles POST /tasks/:id/complete
// Task 완료 처리 핸들러
//
// RESTful 설계:
// - POST /tasks/:id/complete
// - 상태 변경을 명시적인 액션으로 표현
//
// @Summary Mark task as completed
// @Description Mark a task as completed by its ID
// @Tags tasks
// @Produce json
// @Param id path int true "Task ID"
// @Success 200 {object} Response
// @Failure 404 {object} Response
// @Router /tasks/{id}/complete [post]
func (h *TaskHandler) MarkTaskAsCompleted(c *gin.Context) {
	// 1. URL 파라미터 추출
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		RespondValidationError(c, err)
		return
	}

	// 2. UseCase 호출
	task, err := h.usecase.MarkTaskAsCompleted(uint(id))
	if err != nil {
		RespondError(c, err)
		return
	}

	// 3. 성공 응답
	RespondSuccess(c, http.StatusOK, "Task marked as completed", task)
}

/*
주요 학습 포인트:

1. Handler의 책임
   - HTTP 요청 파싱
   - 입력 검증 (binding tags)
   - UseCase 호출 (비즈니스 로직 위임)
   - HTTP 응답 생성
   - 비즈니스 로직 포함 X!

2. Gin Request Binding
   - ShouldBindJSON: JSON 바인딩
   - binding 태그로 자동 검증
   - required, min, max, oneof 등

3. URL Parameter 처리
   - c.Param("id"): URL 파라미터
   - c.Query("key"): Query 파라미터
   - strconv로 타입 변환

4. HTTP Status Codes
   - 200 OK: 성공
   - 201 Created: 생성 성공
   - 400 Bad Request: 잘못된 요청
   - 404 Not Found: 리소스 없음

5. RESTful API 설계
   - POST /tasks: 생성
   - GET /tasks: 목록 조회
   - GET /tasks/:id: 단일 조회
   - PUT /tasks/:id: 수정
   - DELETE /tasks/:id: 삭제
   - POST /tasks/:id/complete: 특정 액션

6. DTO (Data Transfer Object)
   - 요청/응답 데이터 구조체
   - 도메인 엔티티와 분리
   - API 계약 명시

7. Error Handling
   - 검증 에러: RespondValidationError
   - 비즈니스 에러: RespondError
   - 일관된 에러 응답

Handler는 얇게(Thin) 유지:
- 복잡한 로직은 UseCase로
- HTTP 변환만 담당
- 테스트 용이성
*/
