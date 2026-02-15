package main

import (
	"fmt"
	"errors"
)

func main() {
	fmt.Println("=== 1. 기본 함수 ===")

	// 함수 호출
	greet()
	greetPerson("철수")

	fmt.Println("\n=== 2. 반환값이 있는 함수 ===")

	sum := add(10, 20)
	fmt.Printf("10 + 20 = %d\n", sum)

	result := multiply(5, 7)
	fmt.Printf("5 × 7 = %d\n", result)

	fmt.Println("\n=== 3. 여러 값을 반환하는 함수 ===")
	// Go의 특징: 함수가 여러 값을 반환할 수 있습니다!

	quotient, remainder := divide(17, 5)
	fmt.Printf("17 ÷ 5 = 몫: %d, 나머지: %d\n", quotient, remainder)

	// 반환값 중 일부만 필요하면 _로 무시
	q, _ := divide(20, 3)
	fmt.Printf("20 ÷ 3 = 몫: %d\n", q)

	fmt.Println("\n=== 4. 이름이 지정된 반환값 ===")

	x, y := swap(5, 10)
	fmt.Printf("swap(5, 10) = %d, %d\n", x, y)

	min, max := minMax(10, 20, 5, 30, 15)
	fmt.Printf("최소값: %d, 최대값: %d\n", min, max)

	fmt.Println("\n=== 5. 에러 처리 ===")
	// Go에서는 에러를 마지막 반환값으로 돌려주는 것이 관례입니다

	result, err := safeDivide(10, 2)
	if err != nil {
		fmt.Printf("에러 발생: %v\n", err)
	} else {
		fmt.Printf("10 ÷ 2 = %.2f\n", result)
	}

	result, err = safeDivide(10, 0)
	if err != nil {
		fmt.Printf("에러 발생: %v\n", err)
	} else {
		fmt.Printf("결과: %.2f\n", result)
	}

	fmt.Println("\n=== 6. 가변 인자 함수 (Variadic Functions) ===")
	// 매개변수 개수가 정해지지 않은 함수

	total := sum(1, 2, 3, 4, 5)
	fmt.Printf("1+2+3+4+5 = %d\n", total)

	printNames("철수", "영희", "민수")

	// 슬라이스를 가변 인자로 전달
	numbers := []int{10, 20, 30}
	total = sum(numbers...) // ...를 붙여서 펼쳐서 전달
	fmt.Printf("슬라이스 합계: %d\n", total)

	fmt.Println("\n=== 7. 익명 함수와 클로저 ===")

	// 익명 함수를 변수에 할당
	square := func(n int) int {
		return n * n
	}
	fmt.Printf("5의 제곱: %d\n", square(5))

	// 즉시 실행 함수
	func(msg string) {
		fmt.Println("즉시 실행:", msg)
	}("안녕하세요!")

	// 클로저: 외부 변수를 캡처하는 함수
	counter := makeCounter()
	fmt.Println("카운터:", counter()) // 1
	fmt.Println("카운터:", counter()) // 2
	fmt.Println("카운터:", counter()) // 3

	fmt.Println("\n=== 8. 고차 함수 (Higher-Order Functions) ===")
	// 함수를 매개변수로 받거나 함수를 반환하는 함수

	nums := []int{1, 2, 3, 4, 5}

	// 함수를 매개변수로 전달
	doubled := mapInts(nums, func(n int) int {
		return n * 2
	})
	fmt.Printf("원본: %v\n", nums)
	fmt.Printf("2배: %v\n", doubled)

	// 짝수만 필터링
	evens := filterInts(nums, func(n int) bool {
		return n%2 == 0
	})
	fmt.Printf("짝수: %v\n", evens)

	fmt.Println("\n=== 9. 재귀 함수 ===")

	fmt.Println("팩토리얼:")
	for i := 1; i <= 5; i++ {
		fmt.Printf("%d! = %d\n", i, factorial(i))
	}

	fmt.Println("\n피보나치 수열:")
	for i := 0; i < 10; i++ {
		fmt.Printf("fib(%d) = %d\n", i, fibonacci(i))
	}
}

// 매개변수가 없고 반환값도 없는 함수
func greet() {
	fmt.Println("안녕하세요!")
}

// 매개변수가 있는 함수
func greetPerson(name string) {
	fmt.Printf("안녕하세요, %s님!\n", name)
}

// 반환값이 있는 함수
// 함수명(매개변수) 반환타입 형식
func add(a int, b int) int {
	return a + b
}

// 같은 타입의 매개변수는 타입을 한 번만 쓸 수 있습니다
func multiply(a, b int) int {
	return a * b
}

// 여러 값을 반환하는 함수
func divide(a, b int) (int, int) {
	quotient := a / b  // 몫
	remainder := a % b // 나머지
	return quotient, remainder
}

// 이름이 지정된 반환값 (Named Return Values)
func swap(a, b int) (x, y int) {
	x = b
	y = a
	return // 반환값 이름을 지정했으면 return만 써도 됩니다
}

// 가변 인자를 받는 함수
func minMax(numbers ...int) (min, max int) {
	if len(numbers) == 0 {
		return 0, 0
	}

	min, max = numbers[0], numbers[0]
	for _, n := range numbers {
		if n < min {
			min = n
		}
		if n > max {
			max = n
		}
	}
	return
}

// 에러를 반환하는 함수
func safeDivide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, errors.New("0으로 나눌 수 없습니다")
	}
	return a / b, nil // nil은 에러가 없다는 뜻
}

// 가변 인자 함수
func sum(numbers ...int) int {
	total := 0
	for _, n := range numbers {
		total += n
	}
	return total
}

func printNames(names ...string) {
	fmt.Print("이름 목록: ")
	for i, name := range names {
		if i > 0 {
			fmt.Print(", ")
		}
		fmt.Print(name)
	}
	fmt.Println()
}

// 클로저를 반환하는 함수
func makeCounter() func() int {
	count := 0 // 이 변수는 반환된 함수에 의해 캡처됩니다
	return func() int {
		count++
		return count
	}
}

// 고차 함수: 함수를 매개변수로 받음
func mapInts(numbers []int, f func(int) int) []int {
	result := make([]int, len(numbers))
	for i, n := range numbers {
		result[i] = f(n)
	}
	return result
}

func filterInts(numbers []int, f func(int) bool) []int {
	result := []int{}
	for _, n := range numbers {
		if f(n) {
			result = append(result, n)
		}
	}
	return result
}

// 재귀 함수
func factorial(n int) int {
	if n <= 1 {
		return 1
	}
	return n * factorial(n-1)
}

func fibonacci(n int) int {
	if n <= 1 {
		return n
	}
	return fibonacci(n-1) + fibonacci(n-2)
}
