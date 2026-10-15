// 10~12장 모듈: JWT 인증 + STOMP 인가
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-websocket")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    // JWT 라이브러리. api 만 컴파일 시점에 보이고, 구현(impl)·JSON 처리(jackson)는 실행 시점에만 필요하다.
    implementation("io.jsonwebtoken:jjwt-api:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")
}
