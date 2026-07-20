import unittest

from havadurumu.domain.models import CurrentWeather, WeatherReport
from havadurumu.services.weather_service import InvalidCityError, WeatherService


class RecordingProvider:
    def __init__(self) -> None:
        self.requested_cities: list[str] = []
        self.report = WeatherReport(
            current=CurrentWeather(
                city="Ankara",
                country="Türkiye",
                temperature_c=25,
                feels_like_c=24,
                humidity_percent=40,
                wind_speed_kmph=12,
                wind_direction="NW",
                description="Açık",
                pressure_hpa=1014,
                visibility_km=10,
            ),
            forecasts=(),
        )

    def get_weather(self, city: str) -> WeatherReport:
        self.requested_cities.append(city)
        return self.report


class WeatherServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.provider = RecordingProvider()
        self.service = WeatherService(self.provider)

    def test_normalizes_city_before_calling_provider(self) -> None:
        result = self.service.get_weather("  New   York  ")

        self.assertIs(result, self.provider.report)
        self.assertEqual(self.provider.requested_cities, ["New York"])

    def test_rejects_empty_city_without_calling_provider(self) -> None:
        with self.assertRaises(InvalidCityError):
            self.service.get_weather("   ")

        self.assertEqual(self.provider.requested_cities, [])

    def test_rejects_overly_long_city(self) -> None:
        with self.assertRaises(InvalidCityError):
            self.service.get_weather("x" * 101)


if __name__ == "__main__":
    unittest.main()
