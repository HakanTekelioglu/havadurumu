"""Hava Durumu Flask uygulaması."""

from collections.abc import Mapping
from typing import Any

from flask import Flask

from havadurumu.infrastructure.wttr_provider import WttrWeatherProvider
from havadurumu.ports.weather_provider import WeatherProvider
from havadurumu.services.weather_service import WeatherService
from havadurumu.web.routes import create_weather_blueprint


def create_app(
    config: Mapping[str, Any] | None = None,
    *,
    provider: WeatherProvider | None = None,
) -> Flask:
    """Uygulamayı kurar ve dış bağımlılıkları tek noktada bağlar."""

    app = Flask(__name__)
    app.config.from_mapping(
        WTTR_BASE_URL="https://wttr.in",
        WEATHER_REQUEST_TIMEOUT=10,
        WEATHER_LANGUAGE="tr",
    )

    if config:
        app.config.from_mapping(config)

    weather_provider = provider or WttrWeatherProvider(
        base_url=app.config["WTTR_BASE_URL"],
        timeout=app.config["WEATHER_REQUEST_TIMEOUT"],
        language=app.config["WEATHER_LANGUAGE"],
    )
    weather_service = WeatherService(weather_provider)

    app.extensions["weather_service"] = weather_service
    app.register_blueprint(create_weather_blueprint(weather_service))

    return app
