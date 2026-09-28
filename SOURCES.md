# Kaynaklar ve veri kökeni

## ATNF Pulsar Catalogue / NASA HEASARC aynası

- Ana katalog: [CSIRO / ATNF Pulsar Catalogue](https://www.atnf.csiro.au/research/pulsar/psrcat/); [alan tanımları ve atıf isteği](https://www.atnf.csiro.au/research/pulsar/psrcat/psrcat_help.html).
- Alım yolu: [NASA HEASARC ATNF mirror](https://heasarc.gsfc.nasa.gov/W3Browse/all/atnfpulsar.html), TAP `atnfpulsar` tablosu; 28 Eylül 2026 tarihli statik anlık kopya. `scripts/refresh_catalogue.py` sorguyu belgeler.
- `data/pulsars.json`: yedi seçili nesne için ad, takma ad, RA/Dec, P, Ṗ, DM, RM, W50/W10, S400/S1400, uzaklık, katalog türü, ikili model ve ilişki alanları. Bunlar *katalog alanlarıdır*; hepsinin doğrudan ölçüm olduğu iddia edilmez. Eksik değer `null`.
- `data/population.json`: P>0 ve Ṗ>0 olan 2.855 katalog satırının harita için ad/P/Ṗ/tür/ikili model özeti. P<30 ms rengi uygulamanın belirtilmiş görsel sınıflama kuralıdır; katalog türünün yerini almaz.
- Aynanın uzaklık yöntemi alanı kullanılabilir değildir. Bu yüzden `distance_method:null` ve arayüzde “Aynada belirtilmemiş” kullanılır. ATNF'nin uzaklık seçimi birden fazla yöntemi içerebilir; tüm uzaklıklar DM modelinden gelmiş gibi etiketlenmez.
- J1748−2446ad satırındaki aynada sıfır olarak dönen Ṗ, hesaplamaya elverişli bir pozitif ölçüm olmadığı için `null` olarak saklanır. Bu nesne için Ṗ gerektiren çıkarımlar ve katalog P–Ṗ konumu gösterilmez.
- Güncelleme: Sorgu betiği elle çalıştırılır, sonuçlar gözden geçirilir, sayısal testler ve tarayıcı kontrolleri tekrar yapılır. Tarayıcı çalışma sırasında dış servise istek göndermez.
- ATNF yayın kullanımında Manchester, Hobbs, Teoh & Hobbs (2005), *Astronomical Journal* 129, 1993–2006 ve katalog adresinin atfını ister; olabildiğince özgün parametre kaynakları da belirtilmelidir. HEASARC aynası ATNF'yi kaynak olarak gösterir. [CSIRO PSRCAT v2 veri yayını](https://researchdata.edu.au/psrcat-v2-the-pulsar-catalogue/3373599) BSD 3-Clause yeniden kullanım koşulları bildirir; yeni sürüm veya ticari yeniden kullanım öncesinde güncel şartlar kontrol edilmelidir.

## Uygulamada türetilen ve modellenenler

- `physics.js`: ν=1/P, τc=P/(2Ṗ), Bs≈3.2×10¹⁹√(PṖ) G, Ė=4π²IṖ/P³ ve RLC=cP/(2π). I=10⁴⁵ g cm² varsayılır. τc ve Bs standart frenleme yaklaşımının çıkarımlarıdır; doğrudan yaş veya alan ölçümü değildir.
- Geometri: α, ζ ve ρ katalog ölçümü olarak gösterilmez. Varsayılanlar 42°, 48° ve 12° olan *model* değerleridir. Görüş açısı ve Gauss benzeri ışın tepkisi uygulamanın temsili fizik modelidir.
- Yayılım: [Jodrell Bank gözlem ve dispersion açıklaması](https://www.jb.man.ac.uk/distance/frontiers/pulsars/section4.pdf). Uygulama ν MHz, DM pc cm⁻³ iken Δt=4.148808×10⁶ DM (ν_alt⁻²−ν_üst⁻²) ms bağıntısını kullanır. Waterfall sentetiktir.

## Gelecekteki gözlem ve glitch verileri

- [Jodrell Bank EPN profil arşivi](https://www.jb.man.ac.uk/pulsar/Resources/epn/): gerçek atım profilleri için olası küratörlü kaynak. **V2'ye gerçek profil verisi eklenmedi.** `observedProfiles: []` alanı bunun için ayrılmıştır.
- [Jodrell Bank glitch kataloğu](https://www.jb.man.ac.uk/pulsar/glitches/original.html): gelecekteki glitch laboratuvarı için olası kaynak. **V2'de glitch olayı veya tarihsel genlik verisi gösterilmez.** `data/glitches.json` boş veri yuvasıdır; `LabState.FEATURES.glitchLab` kapalıdır. Veri entegrasyonu ve görünüm tamamlanmadan açılmamalıdır.
