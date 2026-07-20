"""Hava durumu sorgulama kullanım senaryosu."""

from havadurumu.domain.models import WeatherReport
from havadurumu.ports.weather_provider import WeatherProvider


class InvalidCityError(ValueError):
    """Kullanıcı geçersiz bir şehir adı gönderdiğinde oluşur."""


class WeatherService:
    """Girdi kurallarını uygular ve hava durumu sağlayıcısını koordine eder."""

    def __init__(self, provider: WeatherProvider) -> None:
        self._provider = provider

    def get_weather(self, city: str) -> WeatherReport:
        normalized_city = self._normalize_city(city)
        return self._provider.get_weather(normalized_city)

    @staticmethod
    def _normalize_city(city: str) -> str:
        normalized_city = " ".join(city.split())

        if not normalized_city:
            raise InvalidCityError("Lütfen bir şehir adı girin.")
        if len(normalized_city) > 100:
            raise InvalidCityError("Şehir adı 100 karakterden uzun olamaz.")

        return normalized_city
