# TaskFlow - Jüri Sunum Raporu 🏆

Bu rapor, projenizi hackathon jürisine sunarken bahsetmeniz gereken en önemli "fark yaratan" teknik detayları içerir. Rakiplerinizden ayrışmanızı sağlayacak anahtarlar buradadır.

## 1. Drag & Drop (Sürükle-Bırak) Kütüphane Seçimi
**Karar:** `@dnd-kit` kullanıldı.
**Neden?**
- Şartnamede belirtilen diğer araçlardan olan `react-beautiful-dnd`'nin resmi bakımı durdurulmuştur (deprecated). Yeni nesil React mimarisi için en mantıklı, modüler ve hafif çözüm `dnd-kit`'tir.
- Mobil cihazlarda sürükleme toleransları (touch sensor delay) native olarak desteklenmektedir. Cihaz ayrımı gözetmeksizin aynı akıcılıkta çalışır.

## 2. Sıralama Algoritması: "Fractional Indexing" (Kritik Avantaj) 🔥
**Karar:** Kartların sırası integer (1, 2, 3) ile değil, Lexicographical (Sözlükbilimsel / a0, a1, b2) değerler ile tutulmuştur.
**Neden?**
- Normalde 100 kartın olduğu bir listede, en alttaki kartı en üste taşırsanız aradaki 99 kartın sıra (index) numarasını veritabanında güncellemeniz gerekir. Bu ciddi bir sunucu yüküdür (`O(n)`).
- **Bizim çözümümüzde:** İki kartın arasına yeni kart geldiğinde sadece o iki kartın index değerine bakılır ve aralarına uygun yeni bir matematiksel string üretilir (Örn: `a0` ile `a2` arasına `a1` yerleşir). 
- Böylece veritabanında sadece **1 adet update işlemi** (`O(1)`) yapılır. Bu yapı Trello, Asana ve Jira'nın kullandığı kurumsal sıralama mantığının birebir aynısıdır! Jüri bunu duyduğunda etkilenecektir.

## 3. Veritabanı ve Güvenlik (Supabase)
**Karar:** PostgreSQL tabanlı Supabase tercih edilmiştir.
**Neden?**
- Kullanıcıların sadece birbirlerini "takım arkadaşı" olarak ekleyebilmesi için özel `Row Level Security (RLS)` kuralları yazılmıştır.
- **Postgres Trigger:** Kullanıcılar `auth.users` üzerinden kayıt olduğunda, yazdığımız özel bir trigger arka planda çalışarak kullanıcıyı `public.profiles` tablosuna otomatik kopyalar. Böylece frontend'den ekstra bir insert sorgusu atmamıza gerek kalmaz.

## 4. Ekstra Özellikler (Beklentinin Ötesi)
Şartnamede sorulan "düşünecek misin?" sorularının tamamı hayata geçirilmiştir:
- **Detaylı Kart Modal'ı:** Kartlara özel öncelik rengi, başlık, detaylı açıklama eklenebilir.
- **Takvim Modülü (Calendar View):** Kullanıcılara klasik Kanban dışında, sadece "Teslim Tarihi" girilmiş görevleri özel bir takvimde "Aşamalarına göre renkli şekilde" (Yapılacak/Bitti/Tik ikonlu) gösterme imkanı eklendi.
- **Etiket Sistemi:** Sınırsız etiket (Bug, Feature, UI/UX vb.) kartlara eklenebilir.
- **Takım Yönetimi:** Sadece sisteme e-posta ile kayıt olmuş yetkili kişiler aratılarak "Sorumlu" olarak görevlere atanabilir.

## 5. Offline Desteği (Fallback)
**Karar:** `localStorage` mimarisi kuruldu.
**Neden?**
- İnternet kopsa veya sunucudan veri çekilemese bile uygulama çökmüyor. Local cache üzerinden varsayılan "TaskFlow" panosunu gösterip kullanıcının deneyimini kesmiyor.

---
**💡 Sunum İpucu:** Jüriye sunum yaparken direkt bir kart oluşturup onu aralara sürükleyin ve ardından *Fractional Indexing* kullandığınız için arkada sadece tek bir satırın güncellendiğini vurgulayın! Başarılar! 🚀
