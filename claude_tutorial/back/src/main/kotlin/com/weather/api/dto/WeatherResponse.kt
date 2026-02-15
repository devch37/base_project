package com.weather.api.dto

import com.fasterxml.jackson.annotation.JsonProperty

data class WeatherResponse(
    val coord: Coord,
    val weather: List<Weather>,
    val base: String,
    val main: Main,
    val visibility: Int,
    val wind: Wind,
    val clouds: Clouds,
    val dt: Long,
    val sys: Sys,
    val timezone: Int,
    val id: Long,
    val name: String,
    val cod: Int
)

data class Coord(
    val lon: Double,
    val lat: Double
)

data class Weather(
    val id: Int,
    val main: String,
    val description: String,
    val icon: String
)

data class Main(
    val temp: Double,
    @JsonProperty("feels_like")
    val feelsLike: Double,
    @JsonProperty("temp_min")
    val tempMin: Double,
    @JsonProperty("temp_max")
    val tempMax: Double,
    val pressure: Int,
    val humidity: Int,
    @JsonProperty("sea_level")
    val seaLevel: Int? = null,
    @JsonProperty("grnd_level")
    val grndLevel: Int? = null
)

data class Wind(
    val speed: Double,
    val deg: Int,
    val gust: Double? = null
)

data class Clouds(
    val all: Int
)

data class Sys(
    val type: Int? = null,
    val id: Long? = null,
    val country: String,
    val sunrise: Long,
    val sunset: Long
)

// 클라이언트에게 보낼 간소화된 응답
data class SimpleWeatherResponse(
    val city: String,
    val country: String,
    val temperature: Double,
    val feelsLike: Double,
    val description: String,
    val icon: String,
    val humidity: Int,
    val windSpeed: Double,
    val timestamp: Long
)

fun WeatherResponse.toSimpleResponse() = SimpleWeatherResponse(
    city = name,
    country = sys.country,
    temperature = main.temp,
    feelsLike = main.feelsLike,
    description = weather.firstOrNull()?.description ?: "",
    icon = weather.firstOrNull()?.icon ?: "",
    humidity = main.humidity,
    windSpeed = wind.speed,
    timestamp = dt
)
