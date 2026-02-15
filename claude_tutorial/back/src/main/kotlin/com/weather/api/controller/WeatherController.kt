package com.weather.api.controller

import com.weather.api.dto.SimpleWeatherResponse
import com.weather.api.service.WeatherService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/weather")
class WeatherController(
    private val weatherService: WeatherService
) {

    @GetMapping("/city/{city}")
    fun getWeatherByCity(@PathVariable city: String): ResponseEntity<SimpleWeatherResponse> {
        return try {
            val weather = weatherService.getWeatherByCity(city)
            ResponseEntity.ok(weather)
        } catch (e: Exception) {
            ResponseEntity.badRequest().build()
        }
    }

    @GetMapping("/coordinates")
    fun getWeatherByCoordinates(
        @RequestParam lat: Double,
        @RequestParam lon: Double
    ): ResponseEntity<SimpleWeatherResponse> {
        return try {
            val weather = weatherService.getWeatherByCoordinates(lat, lon)
            ResponseEntity.ok(weather)
        } catch (e: Exception) {
            ResponseEntity.badRequest().build()
        }
    }

    @GetMapping("/health")
    fun health(): ResponseEntity<Map<String, String>> {
        return ResponseEntity.ok(mapOf("status" to "UP"))
    }
}

class TestCheck {
    init {
        println("Test Check !!")
    }
}

fun main() {
    val t1 = TestCheck()
    val t2 = TestCheck()
}


