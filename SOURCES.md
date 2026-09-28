# Bilimsel kaynaklar ve veri kökeni

## ATNF Pulsar Catalogue / HEASARC aynası

- Resmî katalog: [CSIRO / ATNF](https://www.atnf.csiro.au/research/pulsar/psrcat/); [alanlar ve atıf](https://www.atnf.csiro.au/research/pulsar/psrcat/psrcat_help.html). Alım: [NASA HEASARC ATNF aynası](https://heasarc.gsfc.nasa.gov/W3Browse/all/atnfpulsar.html), TAP `atnfpulsar` tablosu.
- Kopya tarihi: **28 Eylül 2026**. `scripts/refresh_catalogue.py` sorguyu belgeler. `data/pulsars.json` yedi seçili nesnenin ad, RA/Dec, P, Ṗ, DM, RM, W50/W10, S400/S1400, uzaklık, tür, ikili model ve ilişki alanlarını; `data/population.json` P>0/Ṗ>0 olan 2.855 nesnenin harita özetini taşır.
- Katalogda olmayan alan `null` kalır. Aynada uzaklık yöntemi kullanılabilir olmadığı için `distance_method:null` saklanır. J1748−2446ad için aynada sıfır dönen Ṗ pozitif ölçüm olarak kullanılamaz ve `null` saklanır. Ṗ gerektiren çıkarımlar bu nesne için yapılmaz.
- Haritada P<30 ms için ayrı renk uygulamanın açık görsel kuralıdır; katalog türünün yerine geçmez.
- ATNF, Manchester, Hobbs, Teoh & Hobbs (2005), *Astronomical Journal* **129**, 1993–2006 ve katalog adresinin atfını ister. Parametrelerin özgün makale referansları için ATNF'ye bakın. [PSRCAT v2 veri yayını](https://researchdata.edu.au/psrcat-v2-the-pulsar-catalogue/3373599) yeniden kullanım koşullarını bildirir; yeni veri yayını öncesinde geçerli koşulları kontrol edin.

## Jodrell Bank Pulsar Glitch Catalogue

- [Resmî olay tablosu](https://www.jb.man.ac.uk/pulsar/glitches/gTable.html) ve [katalog açıklaması](https://www.jb.man.ac.uk/pulsar/glitches.html). Kopya tarihi: **28 Eylül 2026**. `data/glitches.json` Crab için 32, Vela için 26 gerçek olay satırı saklar. `scripts/refresh_glitches.py` yalnız bu iki nesneyi çeker; değişiklikleri elle gözden geçirmek gerekir.
- Alanlar: MJD ve gün cinsinden belirsizliği, Δν/ν ve belirsizliği **10⁻⁹**, Δν̇/ν̇ ve belirsizliği **10⁻³** biriminde, olay sıra numarası ve kaynak açıklaması. Resmî tablodaki `X` değeri `null` olur. Grafik yalnız olay noktalarını gösterir; residual veya toparlanma eğrisi oluşturmaz.
- Resmî tablo yayınlarda Basu et al. (2022) ve katalog URL'sinin atfını ister. Kaynağın özgün olay makalesi her satırda tutulur.

## Gözlem profilleri

- [Jodrell Bank EPN profil arşivi](https://www.jb.man.ac.uk/pulsar/Resources/epn/) gerçek radyo profilleri için hedef kaynaktır. **Bu sürümde profil dosyası yoktur.** `observedProfiles: []` açık boş durumdur. Geometriden üretilen profil gözlem olarak sunulmaz. İleride profil eklenecekse nesne, frekans, faz, ölçü birimi, kaynak ve atıf birlikte kaydedilmelidir.

## Hesaplar ve gösterim

- `physics.js`: ν=1/P; ν̇=−Ṗ/P²; τc=P/(2Ṗ); Bs≈3,2×10¹⁹√(PṖ) G; Ė=4π²IṖ/P³; RLC=cP/(2π). Atalet momenti I=10⁴⁵ g cm² varsayılır. τc ve Bs standart frenleme yaklaşımının çıkarımıdır; doğrudan yaş/alan ölçümü değildir.
- Geometri: α, ζ, ρ katalog ölçümü değildir. 42°, 48°, 12° başlangıç modelidir. İki kutuplu görüş kesişimi ve Gauss benzeri sinyal profili temsili modeldir. Ekrandaki oynatma hızı fiziksel P ile karıştırılmaz.
- Yayılım: [Jodrell Bank pulsar gözlem açıklaması](https://www.jb.man.ac.uk/distance/frontiers/pulsars/section4.pdf). Soğuk plazma gecikmesi Δt=4,148808×10⁶ DM(ν_alt⁻²−ν_üst⁻²) ms; ν MHz, DM pc cm⁻³. Waterfall sentetiktir. Zaman örnekleme görsel profil genişliğini yaklaşık temsil eder, gerçek cihaz yanıtını modellemez.
- Dışa aktarımlarda katalog, türetilen değerler ve varsayılan model alanları ayrılır; bilinmeyen belirsizlik/yöntem alanları boş veya `null` kalır.
