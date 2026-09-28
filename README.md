# AstroCom · Pulsar Laboratuvarı V2

Tek sayfalık, kurulum gerektirmeyen pulsar laboratuvarı. [Canlı site](https://pulsar-laboratuvari-kardelen.kardelendemir25.chatgpt.site/) linke sahip herkesçe açılır. `dist/index.html` tek dosya olarak çevrimdışı da çalışır.

## Kullanım

Üstten pulsar seçin. **KATALOG** özgün kayıt değerlerini gösterir; açıların model varsayımı olduğunu ayrıca işaretler. P, Ṗ, DM ya da α/ζ/ρ değişirse **DENEY** açılır ve katalog nesnesi değişmeden kalır. **Katalog değerlerini geri yükle** bütün deney değişikliklerini siler.

- **Geometri:** Ω, μ, manyetik kutuplar ve gözlemci görüş hattı; aynı faz hesabından üretilen atım treni. Gösterim hızı fiziksel P değerinden bağımsızdır. Hareket azaltma ayarında başlangıçta durur; `+15°` ile elle ilerletilebilir.
- **Sinyal:** Geometrik model profili ve gerçek gözlem için dürüst boş durum. Gerçek teleskop profili henüz eklenmedi.
- **P–Ṗ:** 2.855 katalog noktasının logaritmik haritası. Deneyde P/Ṗ değişirse özgün ve deneysel konum birlikte gösterilir.
- **Yayılım:** Katalog DM'si ve seçilen frekans/bant/kanalla sentetik waterfall; dedispersiyon kanalları hizalar.
- **Görevler:** Önce tahmin yazdıran beş kısa fizik deneyi.

## Geliştirme

Çalışma zamanı bağımlılığı yoktur. `index.template.html`, `style.css`, `app.js`, `state.js`, `physics.js` ve `data/*.json` kaynak dosyalardır. `python build.py` bunları `dist/index.html` içine gömer. `node --test tests/*.test.js` fizik ve durum testlerini çalıştırır. Geliştirme önizlemesi için `python -m http.server 8765 --directory dist` yeterlidir.

Veri kökeni, güncelleme yolu ve atıf koşulları için [SOURCES.md](SOURCES.md) dosyasına bakın. Katalog anlık kopyası 28 Eylül 2026 tarihlidir. Bu uygulama gerçek gözlem profilini veya α/ζ/ρ ölçümünü taklit etmez.
