import axios from 'axios';
import { WeatherData } from '../types/weather';

const API_BASE_URL = 'http://localhost:8080/api/weather';

export const weatherApi = {
  getWeatherByCity: async (city: string): Promise<WeatherData> => {
    const response = await axios.get<WeatherData>(`${API_BASE_URL}/city/${city}`);
    return response.data;
  },

  getWeatherByCoordinates: async (lat: number, lon: number): Promise<WeatherData> => {
    const response = await axios.get<WeatherData>(`${API_BASE_URL}/coordinates`, {
      params: { lat, lon }
    });
    return response.data;
  },

  checkHealth: async (): Promise<{ status: string }> => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response.data;
  }
};
