# Atmos Hava Durumu

React 19 ve Flask ile çalışan, wttr.in verilerini modern ve responsive bir
arayüzde sunan hava durumu uygulaması.

## Mimari

```text
React + TypeScript arayüzü
          ↓ JSON
web/routes.py
          ↓
services/weather_service.py
          ↓
ports/weather_provider.py
          ↑
infrastructure/wttr_provider.py
```

- `frontend`: React bileşenleri, etkileşimler ve görsel sistem.
- `havadurumu/web`: React kabuğunu sunan rotalar ve `/api/weather` JSON API'si.
- `havadurumu/services`: Şehir girdisi ve kullanım senaryosu kuralları.
- `havadurumu/infrastructure`: wttr.in adaptörü.
- `havadurumu/domain`: Dış sistemlerden bağımsız veri modelleri.

Arayüz; hava koşuluna göre renk değiştiren tema, °C/°F seçimi, son aramalar,
yükleme ve hata durumları ile klavye ve mobil kullanım desteği içerir.

## Kurulum

Python bağımlılıklarını ve frontend paketlerini kurun:

```powershell
uv sync
npm install
```

## Geliştirme

İki terminal kullanın:

```powershell
uv run python app.py
```

```powershell
npm run dev
```

Vite geliştirme sunucusu `/api` isteklerini Flask'a yönlendirir. Yalnızca Flask
üzerinden çalıştırmak için önce üretim paketini oluşturun:

```powershell
npm run build
uv run python app.py
```

HMR destekli geliştirme arayüzü `http://localhost:5173`, üretim paketiyle Flask
uygulaması ise `http://127.0.0.1:5000` adresinde açılır.

## Test ve doğrulama

```powershell
npm run check
npm run build
uv run python -m unittest discover -v
```

## API

```text
GET /api/weather?sehir=İstanbul
```

Başarılı yanıt güncel hava koşullarını ve üç günlük tahmini JSON olarak döndürür.
Geçersiz şehir ve servis hataları uygun HTTP durum kodlarıyla iletilir.
