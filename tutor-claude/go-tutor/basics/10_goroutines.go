package main

import (
	"fmt"
	"sync"
	"time"
)

func main() {
	fmt.Println("=== 1. 고루틴 기본 ===")
	// 고루틴: Go의 경량 스레드
	// go 키워드로 함수를 비동기로 실행합니다

	// 일반 함수 호출 (동기)
	fmt.Println("동기 호출:")
	sayHello("철수")
	sayHello("영희")

	// 고루틴으로 실행 (비동기)
	fmt.Println("\n고루틴 호출:")
	go sayHello("민수") // 백그라운드에서 실행
	go sayHello("지영") // 백그라운드에서 실행

	// 메인 함수가 끝나면 고루틴도 강제 종료되므로 대기 필요
	time.Sleep(2 * time.Second)

	fmt.Println("\n=== 2. 여러 고루틴 실행 ===")

	for i := 1; i <= 5; i++ {
		go countTo(i, 3)
	}

	time.Sleep(2 * time.Second)

	fmt.Println("\n=== 3. WaitGroup 사용 ===")
	// time.Sleep 대신 WaitGroup으로 고루틴 완료 대기

	var wg sync.WaitGroup

	// 3개의 고루틴 시작
	for i := 1; i <= 3; i++ {
		wg.Add(1) // 대기할 고루틴 수 추가
		go func(id int) {
			defer wg.Done() // 완료되면 카운트 감소
			fmt.Printf("작업 %d 시작\n", id)
			time.Sleep(time.Second)
			fmt.Printf("작업 %d 완료\n", id)
		}(i) // 클로저에 i 값 전달
	}

	wg.Wait() // 모든 고루틴이 완료될 때까지 대기
	fmt.Println("모든 작업 완료!")

	fmt.Println("\n=== 4. 채널 기본 ===")
	// 채널: 고루틴 간 통신 수단

	// 채널 생성 (make 함수 사용)
	ch := make(chan string)

	// 고루틴에서 채널로 데이터 전송
	go func() {
		time.Sleep(time.Second)
		ch <- "안녕하세요!" // 채널에 값 보내기
	}()

	// 채널에서 데이터 수신 (블로킹)
	msg := <-ch // 채널에서 값 받기
	fmt.Printf("받은 메시지: %s\n", msg)

	fmt.Println("\n=== 5. 버퍼링된 채널 ===")

	// 버퍼 없는 채널: 송신과 수신이 동시에 일어나야 함
	unbuffered := make(chan int)

	// 버퍼링된 채널: 버퍼가 가득 차기 전까지 블로킹 안 됨
	buffered := make(chan int, 3) // 크기 3인 버퍼

	// 버퍼링된 채널에 값 보내기
	buffered <- 1
	buffered <- 2
	buffered <- 3
	fmt.Println("3개 값 전송 완료 (블로킹 없음)")

	// buffered <- 4 // 4번째는 블로킹됨 (버퍼 가득 참)

	// 값 받기
	fmt.Printf("받은 값: %d\n", <-buffered)
	fmt.Printf("받은 값: %d\n", <-buffered)
	fmt.Printf("받은 값: %d\n", <-buffered)

	_ = unbuffered

	fmt.Println("\n=== 6. 채널 닫기와 범위 순회 ===")

	numbers := make(chan int)

	// 숫자를 채널로 보내는 고루틴
	go func() {
		for i := 1; i <= 5; i++ {
			numbers <- i
		}
		close(numbers) // 채널 닫기 (더 이상 값을 보내지 않음)
	}()

	// range로 채널에서 값 받기 (채널이 닫힐 때까지)
	fmt.Println("채널에서 받은 숫자:")
	for num := range numbers {
		fmt.Printf("%d ", num)
	}
	fmt.Println()

	fmt.Println("\n=== 7. select 문 ===")
	// select: 여러 채널 연산 중 준비된 것을 선택

	ch1 := make(chan string)
	ch2 := make(chan string)

	go func() {
		time.Sleep(1 * time.Second)
		ch1 <- "첫 번째 채널"
	}()

	go func() {
		time.Sleep(2 * time.Second)
		ch2 <- "두 번째 채널"
	}()

	// 두 채널 모두에서 받기
	for i := 0; i < 2; i++ {
		select {
		case msg1 := <-ch1:
			fmt.Printf("ch1에서 받음: %s\n", msg1)
		case msg2 := <-ch2:
			fmt.Printf("ch2에서 받음: %s\n", msg2)
		}
	}

	fmt.Println("\n=== 8. select with timeout ===")

	slow := make(chan string)

	go func() {
		time.Sleep(3 * time.Second)
		slow <- "느린 응답"
	}()

	select {
	case msg := <-slow:
		fmt.Printf("받음: %s\n", msg)
	case <-time.After(2 * time.Second):
		fmt.Println("타임아웃!")
	}

	fmt.Println("\n=== 9. Worker Pool 패턴 ===")

	jobs := make(chan int, 10)
	results := make(chan int, 10)

	// 3개의 워커 고루틴 생성
	for w := 1; w <= 3; w++ {
		go worker(w, jobs, results)
	}

	// 9개의 작업 전송
	for j := 1; j <= 9; j++ {
		jobs <- j
	}
	close(jobs) // 더 이상 작업 없음

	// 결과 수집
	fmt.Println("작업 결과:")
	for r := 1; r <= 9; r++ {
		result := <-results
		fmt.Printf("%d ", result)
	}
	fmt.Println()

	fmt.Println("\n=== 10. 동시성 안전성 (Race Condition) ===")

	// 문제가 있는 코드 (race condition)
	counter := 0
	var wg2 sync.WaitGroup

	for i := 0; i < 1000; i++ {
		wg2.Add(1)
		go func() {
			defer wg2.Done()
			counter++ // 동시에 접근하면 문제 발생!
		}()
	}

	wg2.Wait()
	fmt.Printf("카운터 (race condition): %d (1000이 아닐 수 있음)\n", counter)

	// 해결책 1: Mutex 사용
	safeCounter := 0
	var mutex sync.Mutex
	var wg3 sync.WaitGroup

	for i := 0; i < 1000; i++ {
		wg3.Add(1)
		go func() {
			defer wg3.Done()
			mutex.Lock()   // 잠금
			safeCounter++  // 안전한 접근
			mutex.Unlock() // 잠금 해제
		}()
	}

	wg3.Wait()
	fmt.Printf("카운터 (mutex 사용): %d\n", safeCounter)

	fmt.Println("\n=== 고루틴과 채널 요약 ===")
	fmt.Println("고루틴:")
	fmt.Println("  - go 키워드로 함수를 비동기 실행")
	fmt.Println("  - 경량 스레드 (수천 개도 가능)")
	fmt.Println("  - sync.WaitGroup으로 완료 대기")
	fmt.Println("\n채널:")
	fmt.Println("  - 고루틴 간 안전한 통신")
	fmt.Println("  - <- 연산자로 송수신")
	fmt.Println("  - 버퍼링 가능")
	fmt.Println("  - close()로 닫기")
	fmt.Println("  - range로 순회")
	fmt.Println("\nselect:")
	fmt.Println("  - 여러 채널 중 준비된 것 선택")
	fmt.Println("  - timeout 구현 가능")
	fmt.Println("\n동시성 안전:")
	fmt.Println("  - sync.Mutex로 공유 자원 보호")
	fmt.Println("  - 채널로 데이터 공유 권장")
}

func sayHello(name string) {
	time.Sleep(time.Second)
	fmt.Printf("안녕하세요, %s님!\n", name)
}

func countTo(id, max int) {
	for i := 1; i <= max; i++ {
		fmt.Printf("고루틴 %d: %d\n", id, i)
		time.Sleep(500 * time.Millisecond)
	}
}

// Worker Pool 패턴의 워커 함수
func worker(id int, jobs <-chan int, results chan<- int) {
	for j := range jobs {
		fmt.Printf("워커 %d가 작업 %d 시작\n", id, j)
		time.Sleep(time.Second)
		fmt.Printf("워커 %d가 작업 %d 완료\n", id, j)
		results <- j * 2 // 결과 전송
	}
}
