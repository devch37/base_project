package main

import "fmt"

// struct 정의: 여러 필드를 묶어서 하나의 타입으로 만듭니다
// 다른 언어의 class와 비슷하지만, 메서드는 별도로 정의합니다
type Person struct {
	Name string // 대문자로 시작하면 외부 패키지에서 접근 가능 (public)
	Age  int
	City string
}

// 소문자로 시작하는 필드는 같은 패키지 내에서만 접근 가능 (private)
type BankAccount struct {
	Owner   string
	balance int // private 필드
}

// 중첩 구조체
type Address struct {
	Street  string
	City    string
	ZipCode string
}

type Employee struct {
	Name    string
	Age     int
	Address Address // 구조체 안에 구조체
}

// 익명 필드를 사용한 구조체 (임베딩)
type Contact struct {
	Email string
	Phone string
}

type Customer struct {
	Name    string
	Contact // 필드 이름 없이 타입만 지정 (임베딩)
}

func main() {
	fmt.Println("=== 1. 구조체 기본 생성 ===")

	// 방법 1: 필드 이름과 함께 초기화 (권장)
	person1 := Person{
		Name: "김철수",
		Age:  25,
		City: "서울",
	}
	fmt.Printf("사람1: %+v\n", person1) // %+v는 필드 이름과 함께 출력

	// 방법 2: 필드 순서대로 초기화 (비권장 - 순서가 바뀌면 버그 발생)
	person2 := Person{Name: "이영희", Age: 30, City: "부산"}
	fmt.Printf("사람2: %+v\n", person2)

	// 방법 3: 일부 필드만 초기화 (나머지는 제로값)
	person3 := Person{
		Name: "박민수",
		// Age와 City는 제로값 (0, "")
	}
	fmt.Printf("사람3: %+v\n", person3)

	// 방법 4: 빈 구조체 생성 (모든 필드가 제로값)
	var person4 Person
	fmt.Printf("사람4: %+v\n", person4)

	fmt.Println("\n=== 2. 구조체 필드 접근 ===")

	// 필드 읽기
	fmt.Printf("이름: %s, 나이: %d, 도시: %s\n", person1.Name, person1.Age, person1.City)

	// 필드 수정
	person1.Age = 26
	person1.City = "인천"
	fmt.Printf("수정 후: %+v\n", person1)

	fmt.Println("\n=== 3. 구조체 포인터 ===")

	// new 키워드로 포인터 생성 (모든 필드가 제로값)
	personPtr := new(Person)
	fmt.Printf("포인터로 생성: %+v\n", personPtr)

	// & 연산자로 주소 가져오기
	p := &Person{
		Name: "최지영",
		Age:  28,
		City: "대전",
	}

	// Go는 자동으로 포인터를 역참조해줍니다
	// (*p).Name 과 p.Name 은 동일합니다
	fmt.Printf("포인터 필드 접근: %s\n", p.Name)

	// 포인터를 통한 수정
	p.Age = 29
	fmt.Printf("수정 후: %+v\n", p)

	// 구조체를 함수에 전달할 때 복사됨을 확인
	changePerson(person1)
	fmt.Printf("함수 호출 후 (값 전달): %+v\n", person1) // 변경되지 않음

	changePersonPtr(p)
	fmt.Printf("함수 호출 후 (포인터 전달): %+v\n", p) // 변경됨

	fmt.Println("\n=== 4. 중첩 구조체 ===")

	emp := Employee{
		Name: "홍길동",
		Age:  35,
		Address: Address{
			Street:  "테헤란로 123",
			City:    "서울",
			ZipCode: "06234",
		},
	}

	fmt.Printf("직원: %+v\n", emp)
	fmt.Printf("주소: %s, %s (%s)\n",
		emp.Address.Street,
		emp.Address.City,
		emp.Address.ZipCode)

	fmt.Println("\n=== 5. 익명 필드 (임베딩) ===")

	customer := Customer{
		Name: "김고객",
		Contact: Contact{
			Email: "customer@example.com",
			Phone: "010-1234-5678",
		},
	}

	// 임베딩된 필드는 직접 접근 가능
	fmt.Printf("고객명: %s\n", customer.Name)
	fmt.Printf("이메일: %s\n", customer.Email) // customer.Contact.Email과 같음
	fmt.Printf("전화번호: %s\n", customer.Phone)

	fmt.Println("\n=== 6. 익명 구조체 ===")
	// 일회성으로 사용할 때 유용합니다

	config := struct {
		Host string
		Port int
	}{
		Host: "localhost",
		Port: 8080,
	}

	fmt.Printf("서버 설정: %s:%d\n", config.Host, config.Port)

	fmt.Println("\n=== 7. 구조체 비교 ===")

	p1 := Person{Name: "철수", Age: 20, City: "서울"}
	p2 := Person{Name: "철수", Age: 20, City: "서울"}
	p3 := Person{Name: "영희", Age: 20, City: "서울"}

	// 모든 필드가 같으면 true
	fmt.Printf("p1 == p2: %v\n", p1 == p2) // true
	fmt.Printf("p1 == p3: %v\n", p1 == p3) // false

	fmt.Println("\n=== 8. 구조체 복사 ===")

	original := Person{Name: "원본", Age: 30, City: "서울"}
	copy := original // 값 복사 (deep copy)

	copy.Name = "복사본"
	fmt.Printf("원본: %+v\n", original)
	fmt.Printf("복사: %+v\n", copy)

	fmt.Println("\n=== 9. Private 필드 예제 ===")

	account := BankAccount{
		Owner:   "홍길동",
		balance: 10000, // 같은 패키지 내에서만 접근 가능
	}

	fmt.Printf("계좌 주인: %s\n", account.Owner)
	// fmt.Println(account.balance) // 다른 패키지에서는 컴파일 에러

	// getter/setter 메서드로 접근 (다음 파일에서 다룹니다)
}

// 값으로 전달 (복사본이 전달됨)
func changePerson(p Person) {
	p.Age = 100 // 복사본만 변경됨
}

// 포인터로 전달 (원본을 수정)
func changePersonPtr(p *Person) {
	p.Age = 100 // 원본이 변경됨
}
