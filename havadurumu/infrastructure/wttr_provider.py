"""wttr.in hava durumu servisi adaptörü."""

from collections.abc import Mapping, Sequence
from typing import Any
from urllib.parse import quote

import requests

from havadurumu.domain.models import CurrentWeather, DailyForecast, WeatherReport
from havadurumu.ports.weather_provider import (
    InvalidWeatherDataError,
    LocationNotFoundError,
    WeatherProviderUnavailableError,
)


class WttrWeatherProvider:
    """wttr.in JSON şemasını uygulamanın alan modellerine dönüştürür."""

    def __init__(
        self,
        *,
        base_url: str,
        timeout: float,
        language: str,
        session: requests.Session | None = None,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        self._language = language
        self._session = session or requests.Session()

    def get_weather(self, city: str) -> WeatherReport:
        url = f"{self._base_url}/{quote(city, safe='')}"

        try:
            response = self._session.get(
                url,
                params={"format": "j1", "lang": self._language},
                timeout=self._timeout,
            )
        except requests.RequestException as exc:
            raise WeatherProviderUnavailableError(
                "Hava durumu servisine şu anda ulaşılamıyor."
            ) from exc

        if response.status_code == 404:
            raise LocationNotFoundError("Şehir bulunamadı.")
        if not response.ok:
            raise WeatherProviderUnavailableError(
                f"Hava durumu servisi {response.status_code} durum kodunu döndürdü."
            )

        try:
            payload = response.json()
        except (requests.JSONDecodeError, ValueError) as exc:
            raise InvalidWeatherDataError(
                "Hava durumu servisi geçersiz bir yanıt döndürdü."
            ) from exc

        return self._to_weather_report(payload)

    @classmethod
    def _to_weather_report(cls, payload: Any) -> WeatherReport:
        try:
            data = cls._mapping(payload)
            current_data = cls._first_mapping(data["current_condition"])
            location_data = cls._first_mapping(data["nearest_area"])

            current = CurrentWeather(
                city=cls._localized_value(location_data["areaName"]),
                country=cls._localized_value(location_data["country"]),
                temperature_c=cls._integer(current_data["temp_C"]),
                feels_like_c=cls._integer(current_data["FeelsLikeC"]),
                humidity_percent=cls._integer(current_data["humidity"]),
                wind_speed_kmph=cls._integer(current_data["windspeedKmph"]),
                wind_direction=str(current_data["winddir16Point"]),
                description=cls._localized_value(current_data["weatherDesc"]),
                pressure_hpa=cls._integer(current_data["pressure"]),
                visibility_km=cls._integer(current_data["visibility"]),
            )

            weather_days = cls._sequence(data["weather"])
            forecasts = tuple(
                cls._to_daily_forecast(cls._mapping(day))
                for day in weather_days[:3]
            )
        except (KeyError, TypeError, IndexError, ValueError) as exc:
            raise InvalidWeatherDataError(
                "Hava durumu verisi beklenen alanları içermiyor."
            ) from exc

        return WeatherReport(current=current, forecasts=forecasts)

    @classmethod
    def _to_daily_forecast(cls, day: Mapping[str, Any]) -> DailyForecast:
        hourly = [
            cls._mapping(item)
            for item in cls._sequence(day["hourly"])
        ]
        if not hourly:
            raise InvalidWeatherDataError("Saatlik tahmin verisi boş.")

        midday = min(
            hourly,
            key=lambda item: abs(cls._integer(item.get("time", 1200)) - 1200),
        )
        return DailyForecast(
            date=str(day["date"]),
            max_temperature_c=cls._integer(day["maxtempC"]),
            min_temperature_c=cls._integer(day["mintempC"]),
            description=cls._localized_value(midday["weatherDesc"]),
        )

    @staticmethod
    def _mapping(value: Any) -> Mapping[str, Any]:
        if not isinstance(value, Mapping):
            raise TypeError("Nesne bekleniyordu.")
        return value

    @staticmethod
    def _sequence(value: Any) -> Sequence[Any]:
        if not isinstance(value, Sequence) or isinstance(value, (str, bytes)):
            raise TypeError("Liste bekleniyordu.")
        return value

    @classmethod
    def _first_mapping(cls, value: Any) -> Mapping[str, Any]:
        return cls._mapping(cls._sequence(value)[0])

    @classmethod
    def _localized_value(cls, value: Any) -> str:
        localized = cls._first_mapping(value)
        return str(localized["value"])

    @staticmethod
    def _integer(value: Any) -> int:
        return int(str(value))
