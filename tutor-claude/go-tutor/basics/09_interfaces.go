package main

import (
	"fmt"
	"math"
)

// === 인터페이스 정의 ===
// 인터페이스는 메서드의 집합을 정의합니다
// 구현을 명시적으로 선언하지 않아도 됩니다 (암묵적 구현)

// Shape 인터페이스: 도형의 넓이를 계산하는 메서드
type Shape interface {
	Area() float64
	Perimeter() float64
}

// Stringer 인터페이스: 문자열 표현을 제공
type Stringer interface {
	String() string
}

// === 구조체 정의 ===

type Rectangle struct {
	Width  float64
	Height float64
}

type Circle struct {
	Radius float64
}

type Triangle struct {
	Base   float64
	Height float64
	Side1  float64
	Side2  float64
	Side3  float64
}

// === Rectangle 메서드들 ===
// Shape 인터페이스를 구현합니다 (명시적 선언 없이!)

func (r Rectangle) Area() float64 {
	return r.Width * r.Height
}

func (r Rectangle) Perimeter() float64 {
	return 2 * (r.Width + r.Height)
}

func (r Rectangle) String() string {
	return fmt.Sprintf("사각형(가로:%.1f, 세로:%.1f)", r.Width, r.Height)
}

// === Circle 메서드들 ===

func (c Circle) Area() float64 {
	return math.Pi * c.Radius * c.Radius
}

func (c Circle) Perimeter() float64 {
	return 2 * math.Pi * c.Radius
}

func (c Circle) String() string {
	return fmt.Sprintf("원(반지름:%.1f)", c.Radius)
}

// === Triangle 메서드들 ===

func (t Triangle) Area() float64 {
	return 0.5 * t.Base * t.Height
}

func (t Triangle) Perimeter() float64 {
	return t.Side1 + t.Side2 + t.Side3
}

func (t Triangle) String() string {
	return fmt.Sprintf("삼각형(밑변:%.1f, 높이:%.1f)", t.Base, t.Height)
}

// === 인터페이스를 사용하는 함수들 ===

// 모든 Shape를 받을 수 있습니다
func printShapeInfo(s Shape) {
	fmt.Printf("도형: %v\n", s)
	fmt.Printf("  넓이: %.2f\n", s.Area())
	fmt.Printf("  둘레: %.2f\n", s.Perimeter())
}

// 여러 도형의 총 넓이 계산
func totalArea(shapes ...Shape) float64 {
	total := 0.0
	for _, shape := range shapes {
		total += shape.Area()
	}
	return total
}

// === 빈 인터페이스 (interface{}) ===
// 모든 타입을 받을 수 있습니다

func printAnything(v interface{}) {
	fmt.Printf("값: %v, 타입: %T\n", v, v)
}

// === 타입 단언 (Type Assertion) ===

func describeShape(s Shape) {
	// 타입 단언: 인터페이스가 특정 타입인지 확인
	if rect, ok := s.(Rectangle); ok {
		fmt.Printf("이것은 사각형입니다. 가로: %.1f, 세로: %.1f\n",
			rect.Width, rect.Height)
	} else if circle, ok := s.(Circle); ok {
		fmt.Printf("이것은 원입니다. 반지름: %.1f\n", circle.Radius)
	} else {
		fmt.Println("알 수 없는 도형입니다")
	}
}

// === 타입 스위치 (Type Switch) ===

func classifyShape(s Shape) {
	switch v := s.(type) {
	case Rectangle:
		fmt.Printf("사각형: %.1f x %.1f\n", v.Width, v.Height)
	case Circle:
		fmt.Printf("원: 반지름 %.1f\n", v.Radius)
	case Triangle:
		fmt.Printf("삼각형: 밑변 %.1f, 높이 %.1f\n", v.Base, v.Height)
	default:
		fmt.Printf("알 수 없는 타입: %T\n", v)
	}
}

// === 인터페이스 조합 ===

type ReadWriter interface {
	Read() string
	Write(string)
}

type File struct {
	content string
}

func (f *File) Read() string {
	return f.content
}

func (f *File) Write(data string) {
	f.content = data
}

// === 메인 함수 ===

func main() {
	fmt.Println("=== 1. 인터페이스 기본 ===")

	// 다양한 도형 생성
	rect := Rectangle{Width: 10, Height: 5}
	circle := Circle{Radius: 7}
	triangle := Triangle{
		Base:   8,
		Height: 6,
		Side1:  8,
		Side2:  6,
		Side3:  10,
	}

	// 같은 함수로 다양한 타입 처리 (다형성!)
	printShapeInfo(rect)
	fmt.Println()
	printShapeInfo(circle)
	fmt.Println()
	printShapeInfo(triangle)

	fmt.Println("\n=== 2. 인터페이스 슬라이스 ===")

	// Shape 인터페이스의 슬라이스
	shapes := []Shape{
		Rectangle{Width: 5, Height: 3},
		Circle{Radius: 4},
		Triangle{Base: 6, Height: 4, Side1: 6, Side2: 5, Side3: 5},
	}

	fmt.Println("모든 도형:")
	for i, shape := range shapes {
		fmt.Printf("%d. %v - 넓이: %.2f\n", i+1, shape, shape.Area())
	}

	total := totalArea(shapes...)
	fmt.Printf("총 넓이: %.2f\n", total)

	fmt.Println("\n=== 3. 빈 인터페이스 ===")
	// interface{}는 모든 타입을 받을 수 있습니다

	printAnything(42)
	printAnything("Hello")
	printAnything(true)
	printAnything(rect)
	printAnything([]int{1, 2, 3})

	fmt.Println("\n=== 4. 타입 단언 ===")

	var shape Shape = Circle{Radius: 5}

	// 타입 단언: 안전하게 확인
	if circle, ok := shape.(Circle); ok {
		fmt.Printf("원입니다. 반지름: %.1f\n", circle.Radius)
	}

	// 잘못된 타입 단언
	if _, ok := shape.(Rectangle); !ok {
		fmt.Println("사각형이 아닙니다")
	}

	// ok 없이 단언하면 패닉 발생 가능
	// rect := shape.(Rectangle) // 런타임 패닉!

	fmt.Println("\n=== 5. 타입 스위치 ===")

	for _, s := range shapes {
		classifyShape(s)
	}

	fmt.Println("\n=== 6. 인터페이스 값과 nil ===")

	var s Shape
	fmt.Printf("nil 인터페이스: %v, nil인가? %v\n", s, s == nil)

	var nilRect *Rectangle
	s = nilRect // nil 포인터를 인터페이스에 할당
	fmt.Printf("nil 포인터 할당: %v, nil인가? %v\n", s, s == nil)
	// 주의: 인터페이스가 nil 타입을 가리키면 nil이 아닙니다!

	fmt.Println("\n=== 7. 인터페이스 조합 ===")

	file := &File{}
	file.Write("Hello, Go!")
	content := file.Read()
	fmt.Printf("파일 내용: %s\n", content)

	fmt.Println("\n=== 8. 표준 라이브러리 인터페이스 ===")

	// fmt.Stringer 인터페이스
	// String() string 메서드를 구현하면 자동으로 사용됩니다
	fmt.Println("도형 출력 (String 메서드 사용):")
	fmt.Println(rect)
	fmt.Println(circle)
	fmt.Println(triangle)

	fmt.Println("\n=== 9. 인터페이스 장점 ===")
	fmt.Println("1. 다형성: 같은 인터페이스로 다양한 타입 처리")
	fmt.Println("2. 유연성: 새 타입 추가가 쉬움")
	fmt.Println("3. 테스트 용이: 목(Mock) 객체 만들기 쉬움")
	fmt.Println("4. 결합도 감소: 구현 대신 인터페이스에 의존")
	fmt.Println("5. 암묵적 구현: implements 키워드 불필요")

	fmt.Println("\n=== 10. 실용 패턴 ===")

	// 에러 인터페이스
	type error interface {
		Error() string
	}

	// 함수가 여러 타입을 반환할 때
	shapes2 := []interface{}{
		Rectangle{Width: 5, Height: 3},
		"문자열",
		42,
		Circle{Radius: 2},
	}

	fmt.Println("혼합 타입 슬라이스:")
	for _, item := range shapes2 {
		// 타입에 따라 다른 처리
		switch v := item.(type) {
		case Shape:
			fmt.Printf("도형 - 넓이: %.2f\n", v.Area())
		case string:
			fmt.Printf("문자열: %s\n", v)
		case int:
			fmt.Printf("정수: %d\n", v)
		default:
			fmt.Printf("알 수 없음: %v\n", v)
		}
	}
}
