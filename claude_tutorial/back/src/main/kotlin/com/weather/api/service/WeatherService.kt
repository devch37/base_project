package com.weather.api.service

import com.weather.api.config.WeatherProperties
import com.weather.api.dto.SimpleWeatherResponse
import com.weather.api.dto.WeatherResponse
import com.weather.api.dto.toSimpleResponse
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate
import org.springframework.web.util.UriComponentsBuilder

@Service
class WeatherService(
    private val weatherProperties: WeatherProperties,
    private val restTemplate: RestTemplate = RestTemplate()
) {
    private val logger = LoggerFactory.getLogger(WeatherService::class.java)

    fun getWeatherByCity(city: String): SimpleWeatherResponse {
        logger.info("Fetching weather data for city: $city")

        val url = UriComponentsBuilder
            .fromHttpUrl("${weatherProperties.baseUrl}/weather")
            .queryParam("q", city)
            .queryParam("appid", weatherProperties.key)
            .queryParam("units", "metric")
            .queryParam("lang", "kr")
            .toUriString()

        logger.debug("Request URL: ${url.replace(weatherProperties.key, "***")}")

        val response = restTemplate.getForObject(url, WeatherResponse::class.java)
            ?: throw RuntimeException("Failed to fetch weather data")

        return response.toSimpleResponse()
    }

    fun getWeatherByCoordinates(lat: Double, lon: Double): SimpleWeatherResponse {
        logger.info("Fetching weather data for coordinates: lat=$lat, lon=$lon")

        val url = UriComponentsBuilder
            .fromHttpUrl("${weatherProperties.baseUrl}/weather")
            .queryParam("lat", lat)
            .queryParam("lon", lon)
            .queryParam("appid", weatherProperties.key)
            .queryParam("units", "metric")
            .queryParam("lang", "kr")
            .toUriString()

        val response = restTemplate.getForObject(url, WeatherResponse::class.java)
            ?: throw RuntimeException("Failed to fetch weather data")

        return response.toSimpleResponse()
    }
}
