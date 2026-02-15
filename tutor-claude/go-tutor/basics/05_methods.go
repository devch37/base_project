package main

import (
	"fmt"
	"math"
)

// Person 구조체
type Person struct {
	FirstName string
	LastName  string
	Age       int
}

// Rectangle 구조체
type Rectangle struct {
	Width  float64
	Height float64
}

// Circle 구조체
type Circle struct {
	Radius float64
}

// BankAccount 구조체
type BankAccount struct {
	Owner   string
	balance float64 // private 필드
}

// Counter 구조체
type Counter struct {
	value int
}

func main() {
	fmt.Println("=== 1. 기본 메서드 ===")

	// 메서드는 구조체에 연결된 함수입니다
	person := Person{
		FirstName: "길동",
		LastName:  "홍",
		Age:       30,
	}

	// 메서드 호출
	person.introduce()
	fullName := person.getFullName()
	fmt.Printf("전체 이름: %s\n", fullName)

	fmt.Println("\n=== 2. 값 리시버 vs 포인터 리시버 ===")

	// 값 리시버: 복사본에 대해 작동 (원본 변경 안 됨)
	person.haveBirthdayValue()
	fmt.Printf("값 리시버 후 나이: %d (변경 안 됨)\n", person.Age)

	// 포인터 리시버: 원본에 대해 작동 (원본 변경됨)
	person.haveBirthdayPointer()
	fmt.Printf("포인터 리시버 후 나이: %d (변경됨!)\n", person.Age)

	fmt.Println("\n=== 3. 여러 메서드 예제 ===")

	rect := Rectangle{Width: 10, Height: 5}
	fmt.Printf("사각형: 가로 %.1f, 세로 %.1f\n", rect.Width, rect.Height)
	fmt.Printf("넓이: %.2f\n", rect.area())
	fmt.Printf("둘레: %.2f\n", rect.perimeter())

	circle := Circle{Radius: 7}
	fmt.Printf("\n원: 반지름 %.1f\n", circle.Radius)
	fmt.Printf("넓이: %.2f\n", circle.area())
	fmt.Printf("둘레: %.2f\n", circle.circumference())

	fmt.Println("\n=== 4. Getter와 Setter 패턴 ===")

	account := BankAccount{
		Owner:   "김철수",
		balance: 10000,
	}

	// Getter 메서드로 private 필드 읽기
	fmt.Printf("계좌 주인: %s\n", account.Owner)
	fmt.Printf("잔액: %.2f원\n", account.GetBalance())

	// Setter 메서드로 private 필드 수정
	account.Deposit(5000)
	fmt.Printf("입금 후 잔액: %.2f원\n", account.GetBalance())

	err := account.Withdraw(3000)
	if err != nil {
		fmt.Printf("에러: %v\n", err)
	} else {
		fmt.Printf("출금 후 잔액: %.2f원\n", account.GetBalance())
	}

	// 잔액보다 많이 출금 시도
	err = account.Withdraw(20000)
	if err != nil {
		fmt.Printf("에러: %v\n", err)
	}

	fmt.Println("\n=== 5. 메서드 체이닝 ===")
	// 자기 자신의 포인터를 반환하면 메서드를 연속으로 호출할 수 있습니다

	counter := &Counter{value: 0}

	// 메서드 체이닝
	counter.increment().increment().increment().decrement()
	fmt.Printf("최종 카운터 값: %d\n", counter.getValue())

	// 한 줄로 여러 작업
	result := (&Counter{value: 10}).
		increment().
		increment().
		decrement().
		getValue()
	fmt.Printf("체이닝 결과: %d\n", result)

	fmt.Println("\n=== 6. 메서드와 함수의 차이 ===")

	// 함수 호출 (일반 함수)
	area1 := calculateRectangleArea(rect.Width, rect.Height)
	fmt.Printf("함수로 계산한 넓이: %.2f\n", area1)

	// 메서드 호출 (구조체에 속한 메서드)
	area2 := rect.area()
	fmt.Printf("메서드로 계산한 넓이: %.2f\n", area2)

	fmt.Println("\n=== 7. 포인터 타입에 대한 메서드 ===")

	// 값 타입과 포인터 타입 모두 메서드 호출 가능
	p1 := Person{FirstName: "철수", LastName: "김", Age: 25}
	p2 := &Person{FirstName: "영희", LastName: "이", Age: 28}

	// Go가 자동으로 변환해줍니다
	p1.introduce()      // (&p1).introduce()로 자동 변환
	p2.introduce()      // 이미 포인터

	p1.haveBirthdayPointer() // (&p1).haveBirthdayPointer()로 자동 변환
	p2.haveBirthdayPointer() // 이미 포인터

	fmt.Printf("p1 나이: %d\n", p1.Age)
	fmt.Printf("p2 나이: %d\n", p2.Age)
}

// === Person 메서드들 ===

// 값 리시버 메서드: 읽기 전용 작업에 사용
// (receiver 타입) 형식으로 메서드를 정의합니다
func (p Person) introduce() {
	fmt.Printf("안녕하세요, 저는 %s %s이고 %d살입니다.\n",
		p.LastName, p.FirstName, p.Age)
}

func (p Person) getFullName() string {
	return p.LastName + p.FirstName
}

// 값 리시버는 복사본을 받으므로 원본이 변경되지 않습니다
func (p Person) haveBirthdayValue() {
	p.Age++ // 복사본만 변경됨
	fmt.Println("생일 축하합니다! (값 리시버)")
}

// 포인터 리시버 메서드: 원본을 수정할 때 사용
func (p *Person) haveBirthdayPointer() {
	p.Age++ // 원본이 변경됨
	fmt.Println("생일 축하합니다! (포인터 리시버)")
}

func (p *Person) changeName(firstName, lastName string) {
	p.FirstName = firstName
	p.LastName = lastName
}

// === Rectangle 메서드들 ===

// 값 리시버 - 계산만 하고 수정하지 않음
func (r Rectangle) area() float64 {
	return r.Width * r.Height
}

func (r Rectangle) perimeter() float64 {
	return 2 * (r.Width + r.Height)
}

// 포인터 리시버 - 크기 조정
func (r *Rectangle) scale(factor float64) {
	r.Width *= factor
	r.Height *= factor
}

// === Circle 메서드들 ===

func (c Circle) area() float64 {
	return math.Pi * c.Radius * c.Radius
}

func (c Circle) circumference() float64 {
	return 2 * math.Pi * c.Radius
}

func (c Circle) diameter() float64 {
	return 2 * c.Radius
}

// === BankAccount 메서드들 (Getter/Setter 패턴) ===

// Getter: private 필드를 읽기
// Go 관례: Get 접두사를 생략하고 필드 이름을 그대로 사용
func (b *BankAccount) GetBalance() float64 {
	return b.balance
}

// Setter: private 필드를 수정
func (b *BankAccount) SetBalance(amount float64) {
	b.balance = amount
}

// 비즈니스 로직을 포함한 메서드
func (b *BankAccount) Deposit(amount float64) {
	if amount > 0 {
		b.balance += amount
		fmt.Printf("%.2f원이 입금되었습니다.\n", amount)
	}
}

func (b *BankAccount) Withdraw(amount float64) error {
	if amount <= 0 {
		return fmt.Errorf("출금액은 0보다 커야 합니다")
	}
	if amount > b.balance {
		return fmt.Errorf("잔액이 부족합니다 (현재 잔액: %.2f원)", b.balance)
	}
	b.balance -= amount
	fmt.Printf("%.2f원이 출금되었습니다.\n", amount)
	return nil
}

// === Counter 메서드들 (메서드 체이닝) ===

func (c *Counter) increment() *Counter {
	c.value++
	return c // 자기 자신을 반환
}

func (c *Counter) decrement() *Counter {
	c.value--
	return c
}

func (c *Counter) reset() *Counter {
	c.value = 0
	return c
}

func (c *Counter) getValue() int {
	return c.value
}

// === 일반 함수 (메서드가 아님) ===

func calculateRectangleArea(width, height float64) float64 {
	return width * height
}
