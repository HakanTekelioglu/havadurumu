"""Hava durumu sayfalarının HTTP rotaları."""

from flask import Blueprint, render_template, request

from havadurumu.ports.weather_provider import (
    LocationNotFoundError,
    WeatherProviderError,
)
from havadurumu.services.weather_service import InvalidCityError, WeatherService


def create_weather_blueprint(service: WeatherService) -> Blueprint:
    """Yalnızca ihtiyaç duyduğu servisle çalışan web rotalarını oluşturur."""

    blueprint = Blueprint("weather", __name__)

    @blueprint.get("/")
    def index():
        return render_template("index.html")

    @blueprint.get("/hava")
    def weather():
        city = request.args.get("sehir", "İstanbul")

        try:
            report = service.get_weather(city)
        except InvalidCityError as exc:
            return _render_error(city, str(exc), 400)
        except LocationNotFoundError:
            return _render_error(
                city,
                "Şehir bulunamadı. Lütfen şehir adını kontrol edin.",
                404,
            )
        except WeatherProviderError:
            return _render_error(
                city,
                "Hava durumu bilgisi şu anda alınamıyor. Lütfen daha sonra deneyin.",
                502,
            )

        return render_template("weather.html", report=report, city=city)

    return blueprint


def _render_error(city: str, message: str, status_code: int):
    return render_template("weather.html", error=message, city=city), status_code
