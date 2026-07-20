"""Hava durumu web arayüzü ve JSON API rotaları."""

from dataclasses import asdict

from flask import Blueprint, jsonify, render_template, request

from havadurumu.domain.models import WeatherReport
from havadurumu.ports.weather_provider import (
    LocationNotFoundError,
    WeatherProviderError,
)
from havadurumu.services.weather_service import InvalidCityError, WeatherService


def create_weather_blueprint(service: WeatherService) -> Blueprint:
    """React arayüzünü ve ihtiyaç duyduğu hava durumu API'sini oluşturur."""

    blueprint = Blueprint("weather", __name__)

    @blueprint.get("/")
    def index():
        return _render_app()

    @blueprint.get("/hava")
    def weather():
        city = request.args.get("sehir", "İstanbul")
        report, error, status_code = _get_weather(service, city)
        return _render_app(city=city, report=report, error=error), status_code

    @blueprint.get("/api/weather")
    def weather_api():
        city = request.args.get("sehir", "")
        report, error, status_code = _get_weather(service, city)

        if error:
            return jsonify({"error": error, "query": city}), status_code

        return jsonify(_serialize_report(report))

    return blueprint


def _get_weather(
    service: WeatherService,
    city: str,
) -> tuple[WeatherReport | None, str | None, int]:
    try:
        return service.get_weather(city), None, 200
    except InvalidCityError as exc:
        return None, str(exc), 400
    except LocationNotFoundError:
        return (
            None,
            "Şehir bulunamadı. Lütfen şehir adını kontrol edin.",
            404,
        )
    except WeatherProviderError:
        return (
            None,
            "Hava durumu bilgisi şu anda alınamıyor. Lütfen daha sonra deneyin.",
            502,
        )


def _serialize_report(report: WeatherReport | None) -> dict:
    if report is None:
        return {}
    return asdict(report)


def _render_app(
    *,
    city: str = "",
    report: WeatherReport | None = None,
    error: str | None = None,
):
    initial_state = {
        "view": "weather" if report or error else "landing",
        "query": city,
        "report": _serialize_report(report) if report else None,
        "error": error,
    }
    return render_template(
        "app.html",
        initial_state=initial_state,
        report=report,
        error=error,
    )
