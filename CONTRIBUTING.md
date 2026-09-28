# AstroCom'a katkı

Katkıların bilimsel kaynağı, birimi ve katalog/model ayrımını koruması gerekir. Bir veriyi gerçek gözlem olarak adlandırmadan önce kaynak ve işleme bilgilerini kaydedin.

## Dal ve PR akışı

`main` yayımlanan kararlı sürümdür. `dev` bütünleşme dalıdır. Yeni işler `dev` üzerinden `feature/*` dalında yapılır; PR hedefi `dev` olur. Kararlı sürüm için `dev` → `main` birleştirilir. Geçmiş yeniden yazılmaz ve force push kullanılmaz.

```powershell
git checkout dev
git pull
git checkout -b feature/kisa-konu
python build.py
node --test tests/*.test.js
git add .
git commit -m "feat: kısa açıklama"
git push -u origin feature/kisa-konu
```

PR'de değişikliğin bilimsel gerekçesini, kaynağını, manuel tarayıcı kontrolünü ve test sonucunu yazın. Statik `dist/index.html` kaynak değişikliğiyle birlikte yeniden oluşturulmalıdır.

## Veri ve görseller

- Katalog ve glitch güncellemelerinde `SOURCES.md` ile kaynak betiklerini güncelleyin. Alan/birim değişiklikleri için sayısal test ekleyin.
- Eksik alanları `null` tutun; yaklaşık değeri sessizce kataloğa yazmayın.
- Gözlem profili için EPN veya özgün yayımdan izlenebilir dosya, gözlem frekansı, faz/akı ölçeği ve atıf gereklidir. Gerçek profili sentetik modelden ayrı etiketleyin.
- Erişilebilir metin etiketleri ekleyin; grafik anlamını yalnız renge bırakmayın. Mobil Keşfet ve masaüstü LAB akışlarını gözden geçirin.

Projede açık kaynak lisansı henüz seçilmedi. Lisans kararı proje sahibinindir.
