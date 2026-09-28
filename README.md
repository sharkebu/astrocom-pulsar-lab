# Pulsar Laboratuvarı

PSR J0056+4756 için tek sayfalık, çevrimdışı da açılabilen etkileşimli simülasyon.

## Kullanım

- `dist/index.html` dosyasını doğrudan tarayıcıda açın. Tek dosyadır; ağ veya kurulum gerekmez.
- Periyodu kaydırıcıyla veya hassas sayı alanıyla değiştirin. Dönme hızı ve atım treni aynı faz hesabından beslenir.
- Manyetik eğim `α`, bakış açısı `ζ` ve ışın açıklığı `ρ` geometriyi değiştirir. Işın görüş hattını kesmezse atım görünmez.
- `Ṗ` değişince dipol alanı ve karakteristik yaş yeniden hesaplanır. Uzaklık ayrı bir DM model tahminidir.
- `build.py`, `app.js` içeriğini HTML içine yeniden gömer; uygulama kodunu değiştirdikten sonra `python build.py` çalıştırın.

## Veri ve sınırlar

Başlangıç kaydı: PSR J0056+4756 (B0053+47). Statik katalog örneğinde `P = 0,472037 s`, `Ṗ ≈ 3,3284924 × 10⁻¹⁵ s/s`, `DM = 18,1354 pc cm⁻³` ve `d = 1,123 kpc` kullanılır. `d` elektron yoğunluğu modelinden türetilmiş bir tahmindir. α, ζ ve ρ ölçüm olarak sunulmaz; başlangıçta sırasıyla 42°, 43° ve 12° seçilir.

Gösterilen frekans `f = 1/P`; karakteristik yaş `τ = P/(2Ṗ)`; yüzey dipol alanı `B = 3,2 × 10¹⁹ √(PṖ) G` formülleriyle hesaplanır. Bu son iki değer model varsayımlarına bağlıdır. Yıldız, ışın konisi ve ışık eğrisi temsili bir görselleştirmedir; gerçek teleskop ışık eğrisi veya fiziksel ölçekte bir görüntü değildir. “Gerçek zaman”, seçilen dönme periyodunun saat zamanına 1:1 uygulanması anlamındadır.

Kaynaklar: [ATNF Pulsar Catalogue](https://www.atnf.csiro.au/research/pulsar/psrcat/), [ATNF parametre ve uzaklık açıklamaları](https://www.atnf.csiro.au/research/pulsar/psrcat/psrcat_help.html), [NASA HEASARC katalog açıklaması](https://heasarc.gsfc.nasa.gov/W3Browse/all/atnfpulsar.html).
