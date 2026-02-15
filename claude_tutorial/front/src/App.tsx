import { useState } from 'react';
import { weatherApi } from './services/weatherApi';
import { WeatherCard } from './components/WeatherCard';
import { WeatherData } from './types/weather';
import './App.css';

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!city.trim()) {
      setError('도시 이름을 입력해주세요');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await weatherApi.getWeatherByCity(city);
      setWeather(data);
    } catch (err) {
      setError('날씨 정보를 가져오는데 실패했습니다. 도시 이름을 확인해주세요.');
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('이 브라우저는 위치 정보를 지원하지 않습니다.');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const data = await weatherApi.getWeatherByCoordinates(latitude, longitude);
          setWeather(data);
        } catch (err) {
          setError('현재 위치의 날씨 정보를 가져오는데 실패했습니다.');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('위치 정보를 가져올 수 없습니다.');
        setLoading(false);
      }
    );
  };

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">🌤️ 날씨 대시보드</h1>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="도시 이름을 입력하세요 (예: Seoul, Tokyo, London)"
            className="search-input"
          />
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? '검색 중...' : '검색'}
          </button>
        </form>

        <button
          onClick={handleCurrentLocation}
          className="location-button"
          disabled={loading}
        >
          📍 현재 위치 날씨
        </button>

        {error && <div className="error">{error}</div>}

        {weather && <WeatherCard weather={weather} />}

        {!weather && !error && !loading && (
          <div className="placeholder">
            <p>도시 이름을 검색하거나 현재 위치를 사용하세요</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
