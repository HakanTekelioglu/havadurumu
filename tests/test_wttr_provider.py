import unittest

from havadurumu.infrastructure.wttr_provider import WttrWeatherProvider
from havadurumu.ports.weather_provider import InvalidWeatherDataError


class FakeResponse:
    status_code = 200
    ok = True

    def __init__(self, payload) -> None:
        self._payload = payload

    def json(self):
        return self._payload


class FakeSession:
    def __init__(self, payload) -> None:
        self.response = FakeResponse(payload)
        self.request = None

    def get(self, url, *, params, timeout):
        self.request = {
            "url": url,
            "params": params,
            "timeout": timeout,
        }
        return self.response


def valid_payload():
    return {
        "current_condition": [
            {
                "temp_C": "18",
                "FeelsLikeC": "17",
                "humidity": "61",
                "windspeedKmph": "14",
                "winddir16Point": "WNW",
                "weatherDesc": [{"value": "Hafif yağmurlu"}],
                "pressure": "1008",
                "visibility": "9",
            }
        ],
        "nearest_area": [
            {
                "areaName": [{"value": "Eskişehir"}],
                "country": [{"value": "Türkiye"}],
            }
        ],
        "weather": [
            {
                "date": "2026-07-20",
                "maxtempC": "23",
                "mintempC": "15",
                "hourly": [
                    {
                        "time": "0",
                        "weatherDesc": [{"value": "Açık"}],
                    },
                    {
                        "time": "1200",
                        "weatherDesc": [{"value": "Yağmurlu"}],
                    },
                ],
            }
        ],
    }


class WttrWeatherProviderTests(unittest.TestCase):
    def test_maps_external_payload_and_encodes_city(self) -> None:
        session = FakeSession(valid_payload())
        provider = WttrWeatherProvider(
            base_url="https://example.test/",
            timeout=3,
            language="tr",
            session=session,
        )

        report = provider.get_weather("New York")

        self.assertEqual(
            session.request,
            {
                "url": "https://example.test/New%20York",
                "params": {"format": "j1", "lang": "tr"},
                "timeout": 3,
            },
        )
        self.assertEqual(report.current.city, "Eskişehir")
        self.assertEqual(report.current.temperature_c, 18)
        self.assertEqual(report.forecasts[0].description, "Yağmurlu")

    def test_rejects_payload_that_does_not_match_contract(self) -> None:
        provider = WttrWeatherProvider(
            base_url="https://example.test",
            timeout=3,
            language="tr",
            session=FakeSession({"unexpected": "payload"}),
        )

        with self.assertRaises(InvalidWeatherDataError):
            provider.get_weather("Ankara")


if __name__ == "__main__":
    unittest.main()
