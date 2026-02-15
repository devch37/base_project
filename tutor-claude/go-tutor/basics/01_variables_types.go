package main

import "fmt"

// Go 프로그램의 시작점인 main 함수
func main() {
	fmt.Println("=== 1. 변수 선언 방법 ===")

	// 방법 1: var 키워드로 선언하고 초기값 할당
	var name string = "철수"
	var age int = 25
	fmt.Printf("이름: %s, 나이: %d\n", name, age)

	// 방법 2: 타입 추론 (Go가 자동으로 타입을 파악)
	var city = "서울" // string으로 자동 추론
	var score = 95    // int로 자동 추론
	fmt.Printf("도시: %s, 점수: %d\n", city, score)

	// 방법 3: 짧은 선언 := (가장 많이 사용하는 방법!)
	// 함수 내부에서만 사용 가능
	nickname := "길동이"
	height := 175.5
	fmt.Printf("닉네임: %s, 키: %.1fcm\n", nickname, height)

	// 방법 4: 여러 변수를 한 번에 선언
	var (
		country     = "한국"
		population  = 51000000
		isBeautiful = true
	)
	fmt.Printf("나라: %s, 인구: %d, 아름다운가: %v\n", country, population, isBeautiful)

	fmt.Println("\n=== 2. 기본 데이터 타입 ===")

	// 정수형 (Integer Types)
	var i8 int8 = 127        // -128 ~ 127
	var i16 int16 = 32767    // -32,768 ~ 32,767
	var i32 int32 = 2147483647
	var i64 int64 = 9223372036854775807
	fmt.Printf("int8: %d, int16: %d, int32: %d, int64: %d\n", i8, i16, i32, i64)

	// 부호 없는 정수형 (Unsigned Integers)
	var u8 uint8 = 255       // 0 ~ 255
	var u16 uint16 = 65535   // 0 ~ 65,535
	fmt.Printf("uint8: %d, uint16: %d\n", u8, u16)

	// 실수형 (Floating Point)
	var f32 float32 = 3.14159
	var f64 float64 = 3.141592653589793
	fmt.Printf("float32: %.5f, float64: %.15f\n", f32, f64)

	// 불린형 (Boolean)
	var isTrue bool = true
	var isFalse bool = false
	fmt.Printf("참: %v, 거짓: %v\n", isTrue, isFalse)

	// 문자열 (String)
	var greeting string = "안녕하세요!"
	var multiLine string = `여러 줄의
문자열도
가능합니다`
	fmt.Printf("인사말: %s\n", greeting)
	fmt.Printf("여러 줄: %s\n", multiLine)

	fmt.Println("\n=== 3. 제로값 (Zero Values) ===")
	// Go에서는 변수를 선언만 하고 초기화하지 않으면 기본값(제로값)이 자동 할당됩니다
	var defaultInt int           // 0
	var defaultFloat float64     // 0.0
	var defaultBool bool         // false
	var defaultString string     // "" (빈 문자열)
	fmt.Printf("int 기본값: %d\n", defaultInt)
	fmt.Printf("float64 기본값: %f\n", defaultFloat)
	fmt.Printf("bool 기본값: %v\n", defaultBool)
	fmt.Printf("string 기본값: '%s' (빈 문자열)\n", defaultString)

	fmt.Println("\n=== 4. 상수 (Constants) ===")
	// const 키워드로 선언하며, 값을 변경할 수 없습니다
	const PI = 3.14159
	const AppName = "GoTutor"
	const MaxUsers = 100

	fmt.Printf("원주율: %f\n", PI)
	fmt.Printf("앱 이름: %s\n", AppName)
	fmt.Printf("최대 사용자: %d\n", MaxUsers)

	// 여러 상수를 한 번에 선언
	const (
		StatusOK    = 200
		StatusError = 500
		Version     = "1.0.0"
	)
	fmt.Printf("성공 상태: %d, 에러 상태: %d, 버전: %s\n", StatusOK, StatusError, Version)

	fmt.Println("\n=== 5. 타입 변환 (Type Conversion) ===")
	// Go는 자동 타입 변환을 하지 않습니다. 명시적으로 변환해야 합니다
	var x int = 42
	var y float64 = float64(x) // int를 float64로 변환
	var z int = int(y)         // float64를 int로 변환

	fmt.Printf("원본 int: %d\n", x)
	fmt.Printf("변환된 float64: %f\n", y)
	fmt.Printf("다시 변환된 int: %d\n", z)

	// 문자열과 숫자 변환은 strconv 패키지를 사용합니다 (다른 예제에서 다룹니다)
}
