package main

import "fmt"

func main() {
	fmt.Println("=== 1. 배열 (Array) ===")
	// 배열: 고정된 크기, 크기는 타입의 일부

	// 배열 선언 방법 1: 크기 지정
	var numbers [5]int // [0 0 0 0 0]
	fmt.Printf("빈 배열: %v\n", numbers)

	// 배열 선언 방법 2: 초기값과 함께
	fruits := [3]string{"사과", "바나나", "오렌지"}
	fmt.Printf("과일 배열: %v\n", fruits)

	// 배열 선언 방법 3: 크기를 자동으로 계산
	colors := [...]string{"빨강", "파랑", "노랑", "초록"}
	fmt.Printf("색상 배열: %v (길이: %d)\n", colors, len(colors))

	// 배열 요소 접근
	fmt.Printf("첫 번째 과일: %s\n", fruits[0])
	fmt.Printf("마지막 과일: %s\n", fruits[len(fruits)-1])

	// 배열 요소 수정
	fruits[1] = "포도"
	fmt.Printf("수정 후: %v\n", fruits)

	// 배열 순회
	fmt.Println("배열 순회:")
	for i := 0; i < len(colors); i++ {
		fmt.Printf("  %d: %s\n", i, colors[i])
	}

	// range를 사용한 순회
	fmt.Println("range를 사용한 순회:")
	for index, color := range colors {
		fmt.Printf("  %d: %s\n", index, color)
	}

	// 배열은 값 타입 (복사됨)
	arr1 := [3]int{1, 2, 3}
	arr2 := arr1 // 복사
	arr2[0] = 100
	fmt.Printf("arr1: %v (원본 유지)\n", arr1)
	fmt.Printf("arr2: %v (변경됨)\n", arr2)

	fmt.Println("\n=== 2. 슬라이스 (Slice) ===")
	// 슬라이스: 동적 크기, 배열의 참조 타입
	// 실무에서는 배열보다 슬라이스를 훨씬 많이 사용합니다!

	// 슬라이스 선언 방법 1: 빈 슬라이스
	var emptySlice []int
	fmt.Printf("빈 슬라이스: %v (길이: %d, 용량: %d)\n",
		emptySlice, len(emptySlice), cap(emptySlice))

	// 슬라이스 선언 방법 2: 리터럴로 초기화
	names := []string{"철수", "영희", "민수"}
	fmt.Printf("이름 슬라이스: %v\n", names)

	// 슬라이스 선언 방법 3: make 함수 사용
	// make(타입, 길이, 용량)
	scores := make([]int, 3, 5) // 길이 3, 용량 5
	fmt.Printf("make로 생성: %v (길이: %d, 용량: %d)\n",
		scores, len(scores), cap(scores))

	fmt.Println("\n=== 3. 슬라이스 요소 추가 (append) ===")

	nums := []int{1, 2, 3}
	fmt.Printf("원본: %v (길이: %d, 용량: %d)\n", nums, len(nums), cap(nums))

	// append로 요소 추가 (새 슬라이스 반환)
	nums = append(nums, 4)
	fmt.Printf("추가 후: %v (길이: %d, 용량: %d)\n", nums, len(nums), cap(nums))

	// 여러 요소를 한 번에 추가
	nums = append(nums, 5, 6, 7)
	fmt.Printf("여러 개 추가: %v (길이: %d, 용량: %d)\n", nums, len(nums), cap(nums))

	// 슬라이스를 다른 슬라이스에 추가
	moreNums := []int{8, 9, 10}
	nums = append(nums, moreNums...) // ... 연산자로 펼치기
	fmt.Printf("슬라이스 추가: %v\n", nums)

	fmt.Println("\n=== 4. 슬라이싱 (부분 슬라이스 만들기) ===")

	numbers2 := []int{0, 1, 2, 3, 4, 5, 6, 7, 8, 9}
	fmt.Printf("원본: %v\n", numbers2)

	// slice[start:end] - start 포함, end 미포함
	slice1 := numbers2[2:5] // [2, 3, 4]
	fmt.Printf("numbers[2:5]: %v\n", slice1)

	// 시작 인덱스 생략 (처음부터)
	slice2 := numbers2[:4] // [0, 1, 2, 3]
	fmt.Printf("numbers[:4]: %v\n", slice2)

	// 끝 인덱스 생략 (끝까지)
	slice3 := numbers2[6:] // [6, 7, 8, 9]
	fmt.Printf("numbers[6:]: %v\n", slice3)

	// 둘 다 생략 (전체 복사)
	slice4 := numbers2[:]
	fmt.Printf("numbers[:]: %v\n", slice4)

	fmt.Println("\n=== 5. 슬라이스는 참조 타입 ===")

	original := []int{1, 2, 3, 4, 5}
	reference := original // 참조 복사

	reference[0] = 100
	fmt.Printf("원본: %v (변경됨!)\n", original)
	fmt.Printf("참조: %v\n", reference)

	// 슬라이싱한 것도 같은 배열을 참조
	part := original[1:3]
	part[0] = 200
	fmt.Printf("원본: %v (다시 변경됨!)\n", original)

	fmt.Println("\n=== 6. 슬라이스 복사 (copy) ===")

	src := []int{1, 2, 3, 4, 5}
	dst := make([]int, len(src))

	// copy 함수로 깊은 복사
	n := copy(dst, src)
	fmt.Printf("%d개 요소 복사: %v\n", n, dst)

	// 이제 독립적
	dst[0] = 100
	fmt.Printf("원본: %v (변경 안 됨)\n", src)
	fmt.Printf("복사본: %v\n", dst)

	// 부분 복사
	partial := make([]int, 3)
	copy(partial, src[2:]) // [3, 4, 5] 복사
	fmt.Printf("부분 복사: %v\n", partial)

	fmt.Println("\n=== 7. 슬라이스에서 요소 삭제 ===")

	items := []string{"a", "b", "c", "d", "e"}
	fmt.Printf("원본: %v\n", items)

	// 인덱스 2의 요소 삭제 (c 삭제)
	index := 2
	items = append(items[:index], items[index+1:]...)
	fmt.Printf("c 삭제 후: %v\n", items)

	// 첫 번째 요소 삭제
	items = items[1:]
	fmt.Printf("첫 요소 삭제: %v\n", items)

	// 마지막 요소 삭제
	items = items[:len(items)-1]
	fmt.Printf("마지막 삭제: %v\n", items)

	fmt.Println("\n=== 8. 슬라이스에 요소 삽입 ===")

	list := []int{1, 2, 5, 6}
	fmt.Printf("원본: %v\n", list)

	// 인덱스 2에 3, 4 삽입
	insertAt := 2
	toInsert := []int{3, 4}

	// 삽입 위치를 기준으로 슬라이스를 나누고 합칩니다
	list = append(list[:insertAt], append(toInsert, list[insertAt:]...)...)
	fmt.Printf("삽입 후: %v\n", list)

	fmt.Println("\n=== 9. 다차원 슬라이스 ===")

	// 2차원 슬라이스 (슬라이스의 슬라이스)
	matrix := [][]int{
		{1, 2, 3},
		{4, 5, 6},
		{7, 8, 9},
	}

	fmt.Println("2차원 슬라이스:")
	for i, row := range matrix {
		for j, val := range row {
			fmt.Printf("  [%d][%d] = %d\n", i, j, val)
		}
	}

	// 동적으로 2차원 슬라이스 생성
	rows, cols := 3, 4
	dynamic := make([][]int, rows)
	for i := range dynamic {
		dynamic[i] = make([]int, cols)
	}
	fmt.Printf("동적 2차원 슬라이스: %v\n", dynamic)

	fmt.Println("\n=== 10. 슬라이스 vs 배열 요약 ===")
	fmt.Println("배열:")
	fmt.Println("  - 고정된 크기")
	fmt.Println("  - 값 타입 (복사됨)")
	fmt.Println("  - 크기가 타입의 일부 ([3]int와 [4]int는 다른 타입)")
	fmt.Println("\n슬라이스:")
	fmt.Println("  - 동적 크기")
	fmt.Println("  - 참조 타입 (배열을 가리킴)")
	fmt.Println("  - 실무에서 주로 사용")
	fmt.Println("  - append, copy 등 편리한 함수 제공")
}
