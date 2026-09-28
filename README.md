# AstroCom Interactive · Pulsar Laboratuvarı V3

[Canlı uygulama](https://pulsar-laboratuvari-kardelen.kardelendemir25.chatgpt.site/) · Türkçe, tek sayfalık ve bağımlılıksız bir pulsar keşif ve çalışma aracı. `dist/index.html` tek dosya olarak da açılabilir; URL bağlantıları aynı dosya içindeki `#` rotalarını kullanır.

## İki çalışma yolu

- **Keşfet:** Işını yakala, dönüş hızını sez, radyo yayılımını düzelt, gerçek pulsarları karşılaştır. Önce tahmin ve deney, ardından açıklama ve LAB bağlantısı.
- **LAB:** Katalog özeti, dönme geometrisi, zamanlama, 2.855 noktalı P–Ṗ haritası, yayılım modeli, dürüst gözlem durumu, Crab/Vela glitch olayları, ham veri ve 2–4 nesneli karşılaştırma.

Katalog değerleri `KATALOG`, formülle hesaplananlar `TÜRETİLEN`, açı ve sentetik sinyal `MODEL`, kullanıcı değişiklikleri `DENEY` olarak ayrılır. Bilinmeyen alanlar `Veri yok` görünür. LAB ayarları ve karşılaştırma seçimi URL ile paylaşılır. Katalog kaydı deney sırasında değişmez.

## Yerel geliştirme

Python 3 ve Node.js gerekir; çalıştırma zamanı için npm paketi yoktur.

```powershell
python build.py
node --test tests/*.test.js
python -m http.server 8765 --directory dist
```

Ardından `http://localhost:8765/` adresini açın. Kaynak dosyalar değiştiğinde `python build.py` komutunu tekrar çalıştırıp sayfayı yenileyin. TypeScript veya bir linter yapılandırması bulunmadığından CI var olmayan typecheck/lint komutlarını çalıştırmaz; JavaScript sözdizimini, bilimsel testleri ve build'i kontrol eder.

## Yapı

- `index.template.html`, `lab.template.html`, `lab-pages.html`: Keşfet/LAB sayfaları ve V2'den korunan aletler.
- `style.css`, `style-v3.css`: ortak enstrüman görünümü ve yeni sayfalar.
- `physics.js`: saf astronomi hesapları; `state.js`: katalog ve deney ayrımı.
- `router.js`: statik `#` rotaları ve paylaşılabilir durum.
- `app.js`: animasyon ve mevcut bilimsel grafikler; `v3.js`, `v3-lab.js`: deney ve LAB akışları.
- `exports.js`: açık katalog/türetilmiş veri şeması ile CSV ve JSON.
- `data/pulsars.json`, `data/population.json`, `data/glitches.json`: tarihli statik kopyalar. Çalışma sırasında bilimsel veri için ağ isteği yapılmaz.
- `build.py`: tüm kaynakları `dist/index.html` dosyasına gömer. Bu dosya sürüm kontrolüne alınır.

## Veri ekleme

- **Pulsar/katalog:** `scripts/refresh_catalogue.py` HEASARC ATNF aynası sorgusunu belgeler. Güncellemeden sonra alanların birimlerini, eksik kayıtlarını ve `SOURCES.md` atıflarını gözden geçirin; testleri çalıştırın.
- **Gözlem profili:** Gerçek EPN profilini kaynak, gözlem frekansı, profil birimleri, faz ölçeği, lisans/atıf ve nesne kimliğiyle birlikte kürate edin. `observedProfiles` boşken LAB açıkça veri olmadığını söyler. Model eğrisini gözlem olarak etiketlemeyin.
- **Glitch:** `python scripts/refresh_glitches.py` resmî Jodrell Bank tablosundan Crab/Vela satırlarını yeniler (`requests` ve `beautifulsoup4` gerekir). Oluşan diff'i, referansları ve `X`→`null` dönüşümünü inceleyin. Bu kayıtlar gerçek olay noktalarıdır; toparlanma eğrisi eklemek için ayrıca doğrulanmış veri gerekir.

Veri ve formül ayrıntıları [SOURCES.md](SOURCES.md), katkı akışı [CONTRIBUTING.md](CONTRIBUTING.md) içindedir. Bu depoda henüz bir `LICENSE` seçilmedi.
