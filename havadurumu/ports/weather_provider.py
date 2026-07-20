"""Hava durumu veri kaynağı sözleşmesi ve sağlayıcı hataları."""

from typing import Protocol

from havadurumu.domain.models import WeatherReport


class WeatherProviderError(Exception):
    """Bir hava durumu sağlayıcısı isteği tamamlayamadığında oluşur."""


class LocationNotFoundError(WeatherProviderError):
    """Sağlayıcı belirtilen konumu bulamadığında oluşur."""


class WeatherProviderUnavailableError(WeatherProviderError):
    """Sağlayıcıya erişilemediğinde veya sağlayıcı hata verdiğinde oluşur."""


class InvalidWeatherDataError(WeatherProviderError):
    """Sağlayıcı beklenen veri sözleşmesine uymayan bir yanıt verdiğinde oluşur."""


class WeatherProvider(Protocol):
    """Servis katmanının kullanabildiği hava durumu kaynağı."""

    def get_weather(self, city: str) -> WeatherReport:
        """Belirtilen şehir için güncel durum ve tahminleri döndürür."""
