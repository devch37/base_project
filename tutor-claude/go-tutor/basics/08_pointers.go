package main

import "fmt"

// 구조체 예제용
type Person struct {
	Name string
	Age  int
}

func main() {
	fmt.Println("=== 1. 포인터 기본 개념 ===")
	// 포인터: 변수의 메모리 주소를 저장하는 변수
	// & 연산자: 주소 얻기
	// * 연산자: 역참조 (주소에 있는 값 읽기/쓰기)

	x := 42
	fmt.Printf("x의 값: %d\n", x)
	fmt.Printf("x의 주소: %p\n", &x) // %p는 포인터 주소 형식

	// 포인터 변수 선언
	var ptr *int    // int 타입을 가리키는 포인터
	ptr = &x        // x의 주소를 저장
	fmt.Printf("ptr이 가리키는 주소: %p\n", ptr)
	fmt.Printf("ptr이 가리키는 값: %d\n", *ptr) // 역참조

	// 포인터를 통해 값 수정
	*ptr = 100
	fmt.Printf("수정 후 x: %d\n", x) // x도 변경됨!

	fmt.Println("\n=== 2. 포인터 선언 방법 ===")

	// 방법 1: var로 선언 (제로값은 nil)
	var p1 *int
	fmt.Printf("p1: %v (nil)\n", p1)

	// 방법 2: 짧은 선언
	num := 20
	p2 := &num
	fmt.Printf("p2: %p, 값: %d\n", p2, *p2)

	// 방법 3: new 함수 사용 (제로값으로 초기화된 메모리 할당)
	p3 := new(int)
	fmt.Printf("p3: %p, 값: %d (제로값)\n", p3, *p3)
	*p3 = 30
	fmt.Printf("수정 후 p3 값: %d\n", *p3)

	fmt.Println("\n=== 3. 값 전달 vs 포인터 전달 ===")

	value := 10
	fmt.Printf("원본 값: %d\n", value)

	// 값 전달: 복사본이 전달됨
	incrementValue(value)
	fmt.Printf("값 전달 후: %d (변경 안 됨)\n", value)

	// 포인터 전달: 원본 주소가 전달됨
	incrementPointer(&value)
	fmt.Printf("포인터 전달 후: %d (변경됨!)\n", value)

	fmt.Println("\n=== 4. 구조체와 포인터 ===")

	// 구조체 값
	person1 := Person{Name: "철수", Age: 25}
	fmt.Printf("person1: %+v\n", person1)

	// 구조체 포인터
	person2 := &Person{Name: "영희", Age: 30}
	fmt.Printf("person2: %+v\n", person2)

	// 포인터를 통한 필드 접근
	// Go는 자동으로 역참조해줍니다
	// person2.Name 은 (*person2).Name 과 같습니다
	person2.Age = 31
	fmt.Printf("수정 후 person2: %+v\n", person2)

	// 함수에 구조체 전달
	modifyPerson(person1)
	fmt.Printf("값 전달 후 person1: %+v (변경 안 됨)\n", person1)

	modifyPersonPtr(person2)
	fmt.Printf("포인터 전달 후 person2: %+v (변경됨!)\n", person2)

	fmt.Println("\n=== 5. nil 포인터 ===")

	var nullPtr *int
	fmt.Printf("null 포인터: %v\n", nullPtr)

	// nil 포인터 체크는 매우 중요!
	if nullPtr == nil {
		fmt.Println("포인터가 nil입니다")
		// *nullPtr = 10 // 런타임 패닉 발생!
	}

	// 안전하게 사용
	nullPtr = new(int)
	*nullPtr = 10
	fmt.Printf("초기화 후: %d\n", *nullPtr)

	fmt.Println("\n=== 6. 포인터를 반환하는 함수 ===")

	// 지역 변수의 포인터를 반환해도 안전합니다
	// Go의 가비지 컬렉터가 관리합니다
	p := createPerson("민수", 28)
	fmt.Printf("생성된 사람: %+v\n", p)

	fmt.Println("\n=== 7. 포인터 배열 vs 배열 포인터 ===")

	// 포인터의 배열
	a, b, c := 1, 2, 3
	ptrArray := [3]*int{&a, &b, &c}
	fmt.Println("포인터의 배열:")
	for i, ptr := range ptrArray {
		fmt.Printf("  [%d]: 주소=%p, 값=%d\n", i, ptr, *ptr)
	}

	// 배열의 포인터
	array := [3]int{10, 20, 30}
	arrayPtr := &array
	fmt.Printf("배열의 포인터: %v\n", arrayPtr)
	(*arrayPtr)[0] = 100 // 역참조해서 배열 요소 수정
	fmt.Printf("수정 후: %v\n", array)

	fmt.Println("\n=== 8. 슬라이스와 포인터 ===")
	// 슬라이스는 이미 참조 타입이므로 포인터로 전달할 필요가 적습니다

	slice := []int{1, 2, 3}
	fmt.Printf("원본 슬라이스: %v\n", slice)

	// 슬라이스를 함수에 전달 (참조)
	modifySlice(slice)
	fmt.Printf("함수 호출 후: %v (변경됨)\n", slice)

	// 하지만 슬라이스 자체를 재할당하려면 포인터가 필요
	appendToSlice(&slice)
	fmt.Printf("append 후: %v (길이 변경됨)\n", slice)

	fmt.Println("\n=== 9. 맵과 포인터 ===")
	// 맵도 참조 타입이므로 포인터로 전달할 필요가 적습니다

	ages := map[string]int{"철수": 25}
	fmt.Printf("원본 맵: %v\n", ages)

	modifyMap(ages)
	fmt.Printf("함수 호출 후: %v (변경됨)\n", ages)

	fmt.Println("\n=== 10. 포인터 실용 예제 ===")

	// 큰 구조체를 복사하지 않고 효율적으로 전달
	type LargeStruct struct {
		Data [1000]int
	}

	large := LargeStruct{}
	large.Data[0] = 42

	// 값 전달: 1000개의 int가 복사됨 (비효율적)
	processValue(large)

	// 포인터 전달: 주소만 복사됨 (효율적)
	processPointer(&large)

	// 옵셔널 값 표현
	name := "철수"
	optionalValue(&name)
	optionalValue(nil)

	fmt.Println("\n=== 11. 포인터 사용 가이드라인 ===")
	fmt.Println("포인터를 사용해야 할 때:")
	fmt.Println("  1. 함수에서 원본 값을 수정해야 할 때")
	fmt.Println("  2. 큰 구조체를 복사하지 않고 전달할 때 (성능)")
	fmt.Println("  3. nil 값을 표현해야 할 때 (옵셔널)")
	fmt.Println("  4. 메서드가 리시버를 수정해야 할 때")
	fmt.Println("\n포인터를 사용하지 않아도 되는 경우:")
	fmt.Println("  1. 슬라이스, 맵, 채널 (이미 참조 타입)")
	fmt.Println("  2. 작은 구조체 (복사 비용이 작음)")
	fmt.Println("  3. 읽기 전용 작업")
}

// 값 전달 함수
func incrementValue(n int) {
	n++ // 복사본만 증가
}

// 포인터 전달 함수
func incrementPointer(n *int) {
	*n++ // 원본 증가
}

// 구조체 값 전달
func modifyPerson(p Person) {
	p.Age = 100 // 복사본만 수정
}

// 구조체 포인터 전달
func modifyPersonPtr(p *Person) {
	p.Age = 100 // 원본 수정
}

// 포인터를 반환하는 함수
func createPerson(name string, age int) *Person {
	// 지역 변수지만 포인터를 반환해도 안전
	// Go의 가비지 컬렉터가 관리
	p := Person{Name: name, Age: age}
	return &p
}

// 슬라이스 수정
func modifySlice(s []int) {
	if len(s) > 0 {
		s[0] = 100 // 원본 변경
	}
}

// 슬라이스에 append (포인터 필요)
func appendToSlice(s *[]int) {
	*s = append(*s, 4, 5)
}

// 맵 수정
func modifyMap(m map[string]int) {
	m["영희"] = 30 // 원본 변경
}

// 큰 구조체 - 값 전달
func processValue(l LargeStruct) {
	// 전체 복사됨
	_ = l.Data[0]
}

// 큰 구조체 - 포인터 전달
func processPointer(l *LargeStruct) {
	// 주소만 복사됨
	_ = l.Data[0]
}

// 옵셔널 값 예제
func optionalValue(name *string) {
	if name == nil {
		fmt.Println("이름이 제공되지 않았습니다")
	} else {
		fmt.Printf("이름: %s\n", *name)
	}
}
