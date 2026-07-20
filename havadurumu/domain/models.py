"""Hava durumu alan modeleri."""

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class CurrentWeather:
    city: str
    country: str
    temperature_c: int
    feels_like_c: int
    humidity_percent: int
    wind_speed_kmph: int
    wind_direction: str
    description: str
    pressure_hpa: int
    visibility_km: int


@dataclass(frozen=True, slots=True)
class DailyForecast:
    date: str
    max_temperature_c: int
    min_temperature_c: int
    description: str


@dataclass(frozen=True, slots=True)
class WeatherReport:
    current: CurrentWeather
    forecasts: tuple[DailyForecast, ...]
