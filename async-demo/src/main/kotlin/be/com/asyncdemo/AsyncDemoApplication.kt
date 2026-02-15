package be.com.asyncdemo

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class AsyncDemoApplication

fun main(args: Array<String>) {
    runApplication<AsyncDemoApplication>(*args)
}
