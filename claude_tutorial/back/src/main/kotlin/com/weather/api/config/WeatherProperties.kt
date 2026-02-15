package com.weather.api.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.stereotype.Component

@Component
@ConfigurationProperties(prefix = "weather.api")
data class WeatherProperties(
    var key: String = "",
    var baseUrl: String = "https://api.openweathermap.org/data/2.5"
)
