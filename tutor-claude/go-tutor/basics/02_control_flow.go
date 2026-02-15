package main

import "fmt"

func main() {
	fmt.Println("=== 1. if 문 (조건문) ===")

	// 기본 if 문
	age := 20
	if age >= 18 {
		fmt.Println("성인입니다")
	}

	// if-else 문
	score := 85
	if score >= 90 {
		fmt.Println("A 학점")
	} else if score >= 80 {
		fmt.Println("B 학점")
	} else if score >= 70 {
		fmt.Println("C 학점")
	} else {
		fmt.Println("재수강 필요")
	}

	// if 문에서 짧은 선언 사용 (매우 유용!)
	// 변수를 선언하고 바로 조건을 검사합니다
	if temp := 25; temp > 30 {
		fmt.Println("덥습니다")
	} else if temp > 20 {
		fmt.Printf("적당합니다 (온도: %d도)\n", temp)
	} else {
		fmt.Println("춥습니다")
	}
	// 주의: temp 변수는 if 블록 안에서만 사용 가능합니다

	fmt.Println("\n=== 2. for 문 (반복문) ===")
	// Go에는 while 문이 없습니다. for 문으로 모든 반복을 처리합니다!

	// 기본 for 문 (C/Java 스타일)
	fmt.Println("1부터 5까지:")
	for i := 1; i <= 5; i++ {
		fmt.Printf("%d ", i)
	}
	fmt.Println()

	// while 문처럼 사용 (조건만 있는 for 문)
	fmt.Println("카운트다운:")
	count := 5
	for count > 0 {
		fmt.Printf("%d ", count)
		count--
	}
	fmt.Println("발사!")

	// 무한 루프 (for만 쓰면 무한 반복)
	// break로 빠져나갈 수 있습니다
	fmt.Println("무한 루프 예제:")
	counter := 0
	for {
		counter++
		if counter > 3 {
			break // 루프 종료
		}
		fmt.Printf("반복 %d\n", counter)
	}

	// continue 사용 (현재 반복을 건너뜀)
	fmt.Println("짝수만 출력:")
	for i := 1; i <= 10; i++ {
		if i%2 != 0 { // 홀수면
			continue // 다음 반복으로
		}
		fmt.Printf("%d ", i)
	}
	fmt.Println()

	// range를 사용한 for 문 (배열, 슬라이스, 맵 순회)
	fruits := []string{"사과", "바나나", "오렌지"}
	fmt.Println("과일 목록:")

	for i := 1; i <= len(fruits); i++ {
		fmt.Printf("%s ", fruits[i])
	}

	for index, fruit := range fruits {
		fmt.Printf("%d번째: %s\n", index+1, fruit)
	}

	// 인덱스가 필요 없으면 _로 무시
	fmt.Println("과일 이름만:")
	for _, fruit := range fruits {
		fmt.Printf("- %s\n", fruit)
	}

	fmt.Println("\n=== 3. switch 문 (선택문) ===")

	// 기본 switch 문
	day := 3
	fmt.Print("오늘은 ")
	switch day {
	case 1:
		fmt.Println("월요일")
	case 2:
		fmt.Println("화요일")
	case 3:
		fmt.Println("수요일")
	case 4:
		fmt.Println("목요일")
	case 5:
		fmt.Println("금요일")
	case 6, 7: // 여러 값을 한 번에 처리
		fmt.Println("주말!")
	default:
		fmt.Println("잘못된 날짜")
	}

	// 표현식을 사용하는 switch
	grade := 85
	switch {
	case grade >= 90:
		fmt.Println("우수")
	case grade >= 80:
		fmt.Println("양호")
	case grade >= 70:
		fmt.Println("보통")
	default:
		fmt.Println("노력 필요")
	}

	// switch에서 짧은 선언 사용
	switch time := 14; {
	case time < 12:
		fmt.Println("오전입니다")
	case time < 18:
		fmt.Printf("오후입니다 (현재 %d시)\n", time)
	default:
		fmt.Println("저녁입니다")
	}

	// 타입 switch (인터페이스의 타입을 확인)
	var value interface{} = "Hello"
	switch v := value.(type) {
	case int:
		fmt.Printf("정수입니다: %d\n", v)
	case string:
		fmt.Printf("문자열입니다: %s\n", v)
	case bool:
		fmt.Printf("불린입니다: %v\n", v)
	default:
		fmt.Printf("알 수 없는 타입: %T\n", v)
	}

	fmt.Println("\n=== 4. 레이블과 goto (가급적 사용하지 않는 것을 권장) ===")

	// 중첩 루프에서 외부 루프 종료하기
	fmt.Println("레이블을 사용한 break:")
OuterLoop:
	for i := 1; i <= 3; i++ {
		for j := 1; j <= 3; j++ {
			fmt.Printf("i=%d, j=%d\n", i, j)
			if i == 2 && j == 2 {
				break OuterLoop // 외부 루프까지 종료
			}
		}
	}
	fmt.Println("루프 종료")

	fmt.Println("\n=== 5. defer (지연 실행) ===")
	// defer는 함수가 종료될 때 실행됩니다
	// 주로 리소스 정리에 사용합니다 (파일 닫기, 락 해제 등)

	fmt.Println("시작")
	defer fmt.Println("함수가 끝나기 직전에 실행됩니다") // 마지막에 실행됨
	fmt.Println("중간")
	fmt.Println("끝")

	// 여러 defer는 LIFO(Last In First Out) 순서로 실행됩니다
	fmt.Println("\n여러 defer 실행 순서:")
	defer fmt.Println("세 번째 defer") // 3번째로 실행
	defer fmt.Println("두 번째 defer") // 2번째로 실행
	defer fmt.Println("첫 번째 defer") // 1번째로 실행
	fmt.Println("일반 코드 실행")
}
