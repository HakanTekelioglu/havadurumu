# Hava Durumu Web Sitesi
# Flask ve requests kütüphanelerini kullanıyoruz
# API: wttr.in (ücretsiz hava durumu servisi)

from flask import Flask, render_template, request
import requests

# Flask uygulamasını oluştur
app = Flask(__name__)


# wttr.in API'den hava durumu bilgisi al
def hava_durumu_getir(sehir):
    """
    Belirtilen şehir için hava durumu bilgisini getirir.
    wttr.in API'sini kullanır.
    """
    # API URL'si - JSON formatında veri istiyoruz
    url = f"https://wttr.in/{sehir}?format=j1&lang=tr"
    
    try:    
        # API'ye istek at
        cevap = requests.get(url, timeout=10)
        
        # İstek başarılı mı kontrol et
        if cevap.status_code == 200:
            return cevap.json()
        else:
            return None
    except:
        # Hata durumunda None döndür
        return None


# Ana sayfa
@app.route("/")
def ana_sayfa():
    """Ana sayfayı gösterir."""
    return render_template("index.html")


# Hava durumu arama
@app.route("/hava", methods=["GET", "POST"])
def hava_durumu():
    """Hava durumu sonuçlarını gösterir."""
    
    # Kullanıcının girdiği şehir adını al
    sehir = request.args.get("sehir", "Istanbul")
    
    # Şehir adını küçük harfe çevir (büyük/küçük harf duyarlılığını kaldır)
    sehir = sehir.lower()
    
    # Hava durumu bilgisini getir(API dan hava bilgisi çeker)
    veri = hava_durumu_getir(sehir)
    
    # Veri varsa işle
    if veri:
        # Mevcut hava durumu
        mevcut = veri["current_condition"][0]
        
        # Konum bilgisi
        konum = veri["nearest_area"][0]
        
        # Hava durumu bilgilerini düzenle
        hava_bilgisi = {
            "sehir": konum["areaName"][0]["value"],
            "ulke": konum["country"][0]["value"],
            "sicaklik": mevcut["temp_C"],
            "hissedilen": mevcut["FeelsLikeC"],
            "nem": mevcut["humidity"],
            "ruzgar_hizi": mevcut["windspeedKmph"],
            "ruzgar_yonu": mevcut["winddir16Point"],
            "durum": mevcut["weatherDesc"][0]["value"],
            "basinc": mevcut["pressure"],
            "gorunurluk": mevcut["visibility"],
        }
        
        # 3 günlük tahmin
        tahminler = []
        for gun in veri["weather"]:
            tahmin = {
                "tarih": gun["date"],
                "max_sicaklik": gun["maxtempC"],
                "min_sicaklik": gun["mintempC"],
                "durum": gun["hourly"][4]["weatherDesc"][0]["value"],  # Öğlen saati
            }
            tahminler.append(tahmin)
        
        return render_template(
            "hava.html",
            hava=hava_bilgisi,
            tahminler=tahminler,
            sehir=sehir
        )
    else:
        # Hata durumunda
        return render_template(
            "hava.html",
            hata="Hava durumu bilgisi alınamadı. Şehir adını kontrol edin.",
            sehir=sehir
        )


# Uygulamayı çalıştır
if __name__ == "__main__":
    # Debug modunda çalıştır (geliştirme için)
    app.run(debug=True)
