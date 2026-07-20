import unittest

from havadurumu import create_app
from havadurumu.domain.models import CurrentWeather, DailyForecast, WeatherReport
from havadurumu.ports.weather_provider import (
    LocationNotFoundError,
    WeatherProviderUnavailableError,
)


class ConfigurableProvider:
    def __init__(self) -> None:
        self.error: Exception | None = None
        self.requested_city: str | None = None
        self.report = WeatherReport(
            current=CurrentWeather(
                city="İstanbul",
                country="Türkiye",
                temperature_c=22,
                feels_like_c=21,
                humidity_percent=58,
                wind_speed_kmph=9,
                wind_direction="NE",
                description="Parçalı bulutlu",
                pressure_hpa=1012,
                visibility_km=10,
            ),
            forecasts=(
                DailyForecast(
                    date="2026-07-20",
                    max_temperature_c=27,
                    min_temperature_c=19,
                    description="Güneşli",
                ),
            ),
        )

    def get_weather(self, city: str) -> WeatherReport:
        self.requested_city = city
        if self.error:
            raise self.error
        return self.report


class WeatherRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.provider = ConfigurableProvider()
        app = create_app({"TESTING": True}, provider=self.provider)
        self.client = app.test_client()

    def test_home_page_is_rendered_without_provider_call(self) -> None:
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertIn("Hava Durumu", response.get_data(as_text=True))
        self.assertIsNone(self.provider.requested_city)

    def test_weather_page_renders_domain_model(self) -> None:
        response = self.client.get("/hava?sehir=%C4%B0stanbul")
        html = response.get_data(as_text=True)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.provider.requested_city, "İstanbul")
        self.assertIn("Parçalı bulutlu", html)
        self.assertIn("22°C", html)
        self.assertIn("2026-07-20", html)

    def test_empty_city_returns_validation_error(self) -> None:
        response = self.client.get("/hava?sehir=%20%20")

        self.assertEqual(response.status_code, 400)
        self.assertIn("Lütfen bir şehir adı girin", response.get_data(as_text=True))

    def test_unknown_city_returns_not_found(self) -> None:
        self.provider.error = LocationNotFoundError()

        response = self.client.get("/hava?sehir=Olmayan")

        self.assertEqual(response.status_code, 404)
        self.assertIn("Şehir bulunamadı", response.get_data(as_text=True))

    def test_provider_failure_returns_bad_gateway(self) -> None:
        self.provider.error = WeatherProviderUnavailableError()

        response = self.client.get("/hava?sehir=Ankara")

        self.assertEqual(response.status_code, 502)
        self.assertIn("şu anda alınamıyor", response.get_data(as_text=True))


if __name__ == "__main__":
    unittest.main()
