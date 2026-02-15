import { WeatherData } from '../types/weather';

interface WeatherCardProps {
  weather: WeatherData;
}

export const WeatherCard = ({ weather }: WeatherCardProps) => {
  const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;

  return (
    <div className="weather-card">
      <div className="weather-header">
        <h2>{weather.city}, {weather.country}</h2>
        <p className="timestamp">
          {new Date(weather.timestamp * 1000).toLocaleString('ko-KR')}
        </p>
      </div>

      <div className="weather-main">
        <img src={iconUrl} alt={weather.description} className="weather-icon" />
        <div className="temperature">
          <span className="temp-value">{Math.round(weather.temperature)}°C</span>
          <p className="description">{weather.description}</p>
        </div>
      </div>

      <div className="weather-details">
        <div className="detail-item">
          <span className="detail-label">체감 온도</span>
          <span className="detail-value">{Math.round(weather.feelsLike)}°C</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">습도</span>
          <span className="detail-value">{weather.humidity}%</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">풍속</span>
          <span className="detail-value">{weather.windSpeed} m/s</span>
        </div>
      </div>
    </div>
  );
};
