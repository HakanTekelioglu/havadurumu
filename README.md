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

## Arayüz tasarımı

Arayüz; açık ve koyu tema, yeşil vurgular, masaüstü yan menü ve mobilde
doğal sayfa kaydırması sunan ortak bir tasarım sistemi kullanır. Şehir araması,
popüler şehirler, son aramalar, anlık hava kartı ve üç günlük tahmin aynı
görsel dilde düzenlenmiştir.

- `frontend/ui.tsx`: shadcn/ui'den uyarlanan Button, Card, Badge, Skeleton
  ve Radix UI tabanlı Tabs bileşenleri. Projenin mevcut CSS yapısı korunur.
- `frontend/styles.css`: tema değişkenleri, bileşen stilleri ve duyarlı düzen.
- Aramaya `/` veya `Ctrl/Cmd + K` ile odaklanılır. Tahmin sekmeleri ok
  tuşları, Home ve End ile kullanılabilir.
- Tema, sıcaklık birimi ve son dört arama tarayıcıda saklanır. Depolama
  kapalıysa uygulama oturum içindeki tercihlerle çalışmaya devam eder.
- Yeni şehir arandığında önceki istek iptal edilir; sonuçların birbirini
  ezmesi ve ana sayfaya döndükten sonra eski isteğin ekranı değiştirmesi önlenir.

Bileşen kaynağı ve MIT lisansı: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Kurulum

Python bağımlılıklarını ve frontend paketlerini kurun:

```powershell
uv sync
npm install
```

## Geliştirme

### Tek komutla çalıştırma

```powershell
npm.cmd start
```

Bu komut arayüzü derler ve Flask sunucusunu başlatır. Uygulamayı
`http://127.0.0.1:5000` adresinden açın. PowerShell'de `npm.ps1` yürütme
ilkesi hatasıyla karşılaşmamak için `npm.cmd` kullanılabilir.

VS Code **Go Live / Live Server** yalnızca statik dosyaları sunar.
Kökteki `index.html` ise Vite tarafından işlenmesi gereken
`frontend/main.tsx` dosyasını yükler. Go Live, TSX kodunu derlemediği için
burada boş ekran veya modül MIME hatası oluşabilir; Flask hava durumu API'sini
de çalıştırmaz. Bu proje için yukarıdaki komutu veya aşağıdaki Vite geliştirme
akışını kullanın.

### Canlı kod güncellemeleri (Vite)

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

## Cloudflare Pages yayını

Cloudflare Pages → atmos → Settings → Build configuration alanlarını şöyle ayarlayın:

| Alan | Değer |
| --- | --- |
| Build command | `npm run build:pages` |
| Build output directory | `dist` |
| Root directory | Boş bırakın (depo kökü) |

Bu değişiklikleri GitHub'a gönderdikten sonra yeni bir production deployment
başlatın. Kökteki `index.html` geliştirme girişidir; depo kökünü doğrudan
yayınlamak `.tsx` MIME hatasına ve boş ekrana neden olur. Pages'e yalnızca
derlenmiş `dist` çıktısı sunulmalıdır.

`npm run build:pages`, HTML ve JavaScript/CSS dosyalarını `dist` içine üretir.
Depo kökündeki `functions/api/weather.js`, Pages Functions tarafından
`/api/weather` adresinde çalıştırılır ve wttr.in yanıtını arayüzün beklediği
JSON'a dönüştürür. Pages yayını için ayrıca bir Flask sunucusu gerekmez.
`public/_routes.json`, Functions çağrılarını `/api/*` yollarıyla sınırlar.
Pages'in varsayılan SPA davranışı `/hava?sehir=İstanbul` bağlantılarını da açar.

Yerelde `npm run dev` ile Flask API'sini kullanmaya devam edebilirsiniz.
`npm run build` komutu Flask için `havadurumu/static/react` çıktısını üretir;
Pages için mutlaka `npm run build:pages` kullanın. `vite preview` yalnızca
statik arayüzü sunar, Pages Functions çalıştırmaz.

## Test ve doğrulama

```powershell
npm run check
npm run build
npm run build:pages
npm run test:pages
uv run python -m unittest discover -v
```

## API

```text
GET /api/weather?sehir=İstanbul
```

Başarılı yanıt güncel hava koşullarını ve üç günlük tahmini JSON olarak döndürür.
Geçersiz şehir ve servis hataları uygun HTTP durum kodlarıyla iletilir.
