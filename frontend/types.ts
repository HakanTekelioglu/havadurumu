export type CurrentWeather = {
  city: string;
  country: string;
  temperature_c: number;
  feels_like_c: number;
  humidity_percent: number;
  wind_speed_kmph: number;
  wind_direction: string;
  description: string;
  pressure_hpa: number;
  visibility_km: number;
};

export type DailyForecast = {
  date: string;
  max_temperature_c: number;
  min_temperature_c: number;
  description: string;
};

export type WeatherReport = {
  current: CurrentWeather;
  forecasts: DailyForecast[];
};

export type InitialState = {
  view: "landing" | "weather";
  query: string;
  report: WeatherReport | null;
  error: string | null;
};

export type TemperatureUnit = "c" | "f";
