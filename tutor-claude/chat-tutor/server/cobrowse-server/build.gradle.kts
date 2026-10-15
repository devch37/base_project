// 13~24장 최종 모듈: 화면 동기화(co-browsing) 상담 서버
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-websocket")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    // /actuator/health — 로드밸런서가 "이 서버 살아 있나?"를 묻는 곳 (23장)
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("io.jsonwebtoken:jjwt-api:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")
    // 23장: 서버 여러 대가 메시지(Topic)와 상태(IMap)를 공유. 버전은 Spring Boot 가 관리한다.
    implementation("com.hazelcast:hazelcast")
}

// java -jar 로 실행할 jar 이름을 고정 (QUICK_START, e2e 스크립트가 이 경로를 쓴다)
tasks.named<org.springframework.boot.gradle.tasks.bundling.BootJar>("bootJar") {
    archiveFileName.set("cobrowse-server.jar")
}
