// 모든 서버 모듈이 공유하는 빌드 설정.
// 각 모듈의 build.gradle.kts 에는 "그 모듈에만 필요한 의존성"만 적는다.
plugins {
    id("org.springframework.boot") version "3.5.6" apply false
    id("io.spring.dependency-management") version "1.1.7" apply false
}

subprojects {
    // server/ 폴더 자체는 코드가 없는 "묶음" 프로젝트라 건너뛴다.
    if (path == ":server") return@subprojects

    apply(plugin = "java")
    apply(plugin = "org.springframework.boot")
    apply(plugin = "io.spring.dependency-management")

    group = "tutor.chat"
    version = "1.0.0"

    extensions.configure<JavaPluginExtension> {
        toolchain { languageVersion.set(JavaLanguageVersion.of(21)) }
    }

    repositories { mavenCentral() }

    dependencies {
        "implementation"("org.springframework.boot:spring-boot-starter-web")
        "testImplementation"("org.springframework.boot:spring-boot-starter-test")
        "testRuntimeOnly"("org.junit.platform:junit-platform-launcher")
    }

    tasks.withType<JavaCompile> {
        options.encoding = "UTF-8"
        // record 의 파라미터 이름을 리플렉션으로 읽을 수 있게 (@PathVariable 이름 생략 등)
        options.compilerArgs.add("-parameters")
    }

    tasks.withType<Test> {
        useJUnitPlatform()
        testLogging { events("failed"); exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.FULL }
    }
}
