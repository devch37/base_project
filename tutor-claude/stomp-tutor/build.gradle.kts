// 모듈 하나짜리 단순한 Spring Boot 프로젝트 (모놀리스)
plugins {
    java
    id("org.springframework.boot") version "3.5.6"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "tutor.stomp"
version = "1.0.0"

java { toolchain { languageVersion.set(JavaLanguageVersion.of(21)) } }

repositories { mavenCentral() }

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")        // REST + 정적 HTML 서빙
    implementation("org.springframework.boot:spring-boot-starter-websocket")  // WebSocket + STOMP
    implementation("com.hazelcast:hazelcast")                                 // 3단계: 서버 여러 대
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<JavaCompile> {
    options.encoding = "UTF-8"
    options.compilerArgs.add("-parameters")
}

tasks.test {
    useJUnitPlatform()
    testLogging { events("passed", "failed") }
}

tasks.bootJar { archiveFileName.set("stomp-tutor.jar") }
