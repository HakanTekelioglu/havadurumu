# Hava Durumu

Flask ve [wttr.in](https://wttr.in) ile çalışan, katmanlı ve test edilebilir bir
hava durumu uygulaması.

## Mimari

Kod, yüksek cohesion ve düşük coupling ilkelerine göre sorumluluklarına ayrılır:

```text
HTTP isteği
    ↓
web/routes.py                 Flask ve şablon yanıtları
    ↓
services/weather_service.py  Girdi ve kullanım senaryosu kuralları
    ↓
ports/weather_provider.py    Sağlayıcıdan beklenen sözleşme
    ↑
infrastructure/              wttr.in adaptörü ve dış JSON dönüşümü
    ↓
domain/models.py             Dış sistemlerden bağımsız veri modelleri
```

- `domain`: Hava durumu modellerini içerir; Flask veya `requests` bilmez.
- `ports`: Servisin dış veri kaynağından beklediği küçük arayüzü tanımlar.
- `services`: Şehir girdisini doğrular ve sorgu kullanım senaryosunu yürütür.
- `infrastructure`: HTTP iletişimi ile wttr.in JSON şemasını kapsüller.
- `web`: İstek/yanıt ve şablon işlemlerini yürütür.
- `create_app`: Somut bağımlılıkları yalnızca uygulama kurulurken birbirine bağlar.

Bu yapı sayesinde wttr.in başka bir sağlayıcıyla web ve servis katmanı
değiştirilmeden değiştirilebilir. Testler de gerçek ağ çağrısı yerine
`WeatherProvider` sözleşmesine uyan sahte nesneler kullanır.

## Çalıştırma

Python 3.13 ve [uv](https://docs.astral.sh/uv/) ile:

```powershell
uv sync
uv run python app.py
```

Uygulama varsayılan olarak `http://127.0.0.1:5000` adresinde açılır.

## Test

Test paketi yalnızca standart `unittest` modülünü kullanır:

```powershell
uv run python -m unittest discover -v
```

## Yapılandırma

`create_app` fonksiyonuna Flask yapılandırması verilebilir:

```python
from havadurumu import create_app

app = create_app(
    {
        "WTTR_BASE_URL": "https://wttr.in",
        "WEATHER_REQUEST_TIMEOUT": 5,
        "WEATHER_LANGUAGE": "tr",
    }
)
```

Testlerde veya farklı bir veri kaynağı kullanırken `provider=` parametresiyle
`WeatherProvider` sözleşmesine uyan bir nesne enjekte edilebilir.
