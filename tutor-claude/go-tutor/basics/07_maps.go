package main

import (
	"fmt"
	"sort"
)

func main() {
	fmt.Println("=== 1. 맵(Map) 기본 ===")
	// 맵: 키-값 쌍을 저장하는 자료구조 (다른 언어의 Dictionary, HashMap)
	// map[키타입]값타입 형식

	// 방법 1: 맵 리터럴로 생성
	ages := map[string]int{
		"철수": 25,
		"영희": 30,
		"민수": 28,
	}
	fmt.Printf("나이 맵: %v\n", ages)

	// 방법 2: make 함수로 생성
	scores := make(map[string]int)
	scores["수학"] = 90
	scores["영어"] = 85
	scores["과학"] = 95
	fmt.Printf("점수 맵: %v\n", scores)

	// 방법 3: 빈 맵 선언 (nil 맵, 사용 전에 make 필요)
	var colors map[string]string
	fmt.Printf("nil 맵: %v\n", colors)
	colors = make(map[string]string) // 초기화
	colors["빨강"] = "red"
	fmt.Printf("초기화 후: %v\n", colors)

	fmt.Println("\n=== 2. 맵 요소 접근 ===")

	// 값 읽기
	age := ages["철수"]
	fmt.Printf("철수의 나이: %d\n", age)

	// 존재하지 않는 키는 제로값 반환
	unknown := ages["길동"]
	fmt.Printf("길동의 나이: %d (존재하지 않음)\n", unknown)

	// 키 존재 여부 확인 (매우 중요!)
	age, exists := ages["영희"]
	if exists {
		fmt.Printf("영희의 나이: %d (존재함)\n", age)
	}

	age, exists = ages["길동"]
	if !exists {
		fmt.Println("길동은 맵에 없습니다")
	}

	fmt.Println("\n=== 3. 맵 요소 추가/수정/삭제 ===")

	// 추가
	ages["수영"] = 22
	fmt.Printf("추가 후: %v\n", ages)

	// 수정 (같은 키에 다시 할당)
	ages["철수"] = 26
	fmt.Printf("수정 후: %v\n", ages)

	// 삭제 (delete 함수 사용)
	delete(ages, "민수")
	fmt.Printf("삭제 후: %v\n", ages)

	// 존재하지 않는 키 삭제 (에러 없음)
	delete(ages, "없는사람")

	fmt.Println("\n=== 4. 맵 순회 ===")

	fmt.Println("이름과 나이:")
	for name, age := range ages {
		fmt.Printf("  %s: %d세\n", name, age)
	}

	// 키만 필요한 경우
	fmt.Println("이름만:")
	for name := range ages {
		fmt.Printf("  - %s\n", name)
	}

	// 값만 필요한 경우
	fmt.Println("나이만:")
	for _, age := range ages {
		fmt.Printf("  %d세\n", age)
	}

	// 주의: 맵의 순회 순서는 보장되지 않습니다!
	fmt.Println("\n순회 순서는 매번 달라질 수 있습니다:")
	for i := 0; i < 3; i++ {
		fmt.Printf("순회 %d: ", i+1)
		for name := range ages {
			fmt.Printf("%s ", name)
		}
		fmt.Println()
	}

	fmt.Println("\n=== 5. 맵 길이 ===")

	fmt.Printf("맵 크기: %d개\n", len(ages))

	// 빈 맵 확인
	emptyMap := make(map[string]int)
	fmt.Printf("빈 맵 크기: %d개\n", len(emptyMap))

	fmt.Println("\n=== 6. 맵은 참조 타입 ===")

	original := map[string]int{"a": 1, "b": 2}
	reference := original // 참조 복사

	reference["a"] = 100
	fmt.Printf("원본: %v (변경됨!)\n", original)
	fmt.Printf("참조: %v\n", reference)

	// 맵 복사는 수동으로 해야 합니다
	copied := make(map[string]int)
	for key, value := range original {
		copied[key] = value
	}
	copied["a"] = 200
	fmt.Printf("원본: %v (변경 안 됨)\n", original)
	fmt.Printf("복사본: %v\n", copied)

	fmt.Println("\n=== 7. 복잡한 맵 타입 ===")

	// 값이 슬라이스인 맵
	studentScores := map[string][]int{
		"철수": {90, 85, 88},
		"영희": {95, 92, 98},
	}
	fmt.Println("학생별 점수:")
	for name, scores := range studentScores {
		fmt.Printf("  %s: %v\n", name, scores)
	}

	// 값이 맵인 맵 (중첩 맵)
	users := map[string]map[string]string{
		"user1": {
			"name":  "김철수",
			"email": "kim@example.com",
		},
		"user2": {
			"name":  "이영희",
			"email": "lee@example.com",
		},
	}
	fmt.Println("사용자 정보:")
	for id, info := range users {
		fmt.Printf("  %s: 이름=%s, 이메일=%s\n", id, info["name"], info["email"])
	}

	// 값이 구조체인 맵
	type Person struct {
		Name string
		Age  int
	}

	people := map[string]Person{
		"id1": {Name: "박민수", Age: 30},
		"id2": {Name: "최지영", Age: 28},
	}
	fmt.Println("사람들:")
	for id, person := range people {
		fmt.Printf("  %s: %s (%d세)\n", id, person.Name, person.Age)
	}

	fmt.Println("\n=== 8. 맵 정렬 ===")
	// 맵 자체는 정렬되지 않지만, 키를 정렬해서 순회할 수 있습니다

	fruits := map[string]int{
		"사과":   5,
		"바나나":  3,
		"오렌지":  7,
		"포도":   2,
	}

	// 키를 슬라이스로 추출
	keys := make([]string, 0, len(fruits))
	for key := range fruits {
		keys = append(keys, key)
	}

	// 키 정렬
	sort.Strings(keys)

	// 정렬된 순서로 출력
	fmt.Println("과일 (정렬됨):")
	for _, key := range keys {
		fmt.Printf("  %s: %d개\n", key, fruits[key])
	}

	fmt.Println("\n=== 9. 맵 초기화와 nil 체크 ===")

	var nilMap map[string]int
	fmt.Printf("nil 맵: %v, nil인가? %v\n", nilMap, nilMap == nil)

	// nil 맵에 쓰기는 패닉 발생!
	// nilMap["key"] = 1 // 런타임 에러!

	// 읽기는 가능 (제로값 반환)
	value := nilMap["key"]
	fmt.Printf("nil 맵에서 읽기: %d\n", value)

	// 안전하게 사용하려면 make로 초기화
	if nilMap == nil {
		nilMap = make(map[string]int)
	}
	nilMap["key"] = 1
	fmt.Printf("초기화 후: %v\n", nilMap)

	fmt.Println("\n=== 10. 실용 예제: 단어 빈도수 계산 ===")

	text := "hello world hello go go go world"
	words := []string{"hello", "world", "hello", "go", "go", "go", "world"}

	// 단어 빈도수 계산
	frequency := make(map[string]int)
	for _, word := range words {
		frequency[word]++
	}

	fmt.Println("단어 빈도수:")
	for word, count := range frequency {
		fmt.Printf("  '%s': %d번\n", word, count)
	}

	fmt.Println("\n=== 맵 요약 ===")
	fmt.Println("- map[키타입]값타입 형식으로 선언")
	fmt.Println("- 키는 비교 가능한 타입이어야 함 (==, != 연산 가능)")
	fmt.Println("- 참조 타입 (함수에 전달하면 원본이 변경됨)")
	fmt.Println("- 순서가 보장되지 않음")
	fmt.Println("- 존재 확인: value, exists := map[key]")
	fmt.Println("- 삭제: delete(map, key)")
}
