# 🚀 TaskFlow - Modern Kanban Proje Yönetimi

TaskFlow; yazılım, tasarım ve organizasyon ekiplerinin süreçlerini görselleştirip hızlandırması için geliştirilmiş, yüksek performanslı ve kullanıcı dostu bir Kanban tahtası uygulamasıdır.

🔗 **Canlı Önizleme:** [taskflow-kappa-black.vercel.app](https://taskflow-kappa-black.vercel.app)

> **Not:** Bu proje, bir **Hackathon** kapsamında 48 saatlik sınırlı bir sürede sıfırdan geliştirilmiştir.

---

## ✨ Öne Çıkan Özellikler

- **Gelişmiş Sürükle ve Bırak:** `@dnd-kit` kullanılarak hazırlanan, hem kartların hem de sütunların yerini değiştirebileceğiniz akıcı deneyim.
- **Detaylı Görev Yönetimi:** Kartlara başlık, açıklama, öncelik seviyesi (Düşük, Orta, Yüksek), sorumlu kişi ve renkli etiketler atama.
- **Takvim Görünümü (Calendar View):** Teslim tarihi belirlenmiş görevlerin aylık takvim üzerinde görsel takibi.
- **Takım İşbirliği:** Kullanıcıları e-posta adresiyle projeye davet etme ve görevlere atama.
- **Gerçek Zamanlı Senkronizasyon:** Yapılan tüm değişiklikler anında veritabanına işlenir ve oturumlar arası korunur.
- **Güvenli Kimlik Doğrulama:** Supabase Auth ile güvenli kayıt ve giriş sistemi.
- **Responsive Tasarım:** Masaüstü ve mobil cihazlarla tam uyumlu arayüz.

## 🛠️ Kullanılan Teknolojiler

- **Frontend:** Next.js 15 (App Router), React, TypeScript
- **Stilleme:** Tailwind CSS, Shadcn UI, Lucide Icons
- **Sürükle-Bırak:** `@dnd-kit` (Core, Sortable, Modifiers)
- **Backend & Veritabanı:** Supabase (PostgreSQL, Row Level Security)
- **Deployment:** Vercel

## 🚀 Kurulum ve Yerel Çalıştırma

Projeyi kendi bilgisayarınızda çalıştırmak için:

1. **Depoyu klonlayın:**
   ```bash
   git clone https://github.com/KULLANICI_ADIN/taskflow.git
   cd taskflow
Bağımlılıkları yükleyin:

code
Bash
npm install
Çevresel değişkenleri ayarlayın:
Kök dizinde .env.local dosyası oluşturup Supabase bilgilerinizi ekleyin:

code
Env
NEXT_PUBLIC_SUPABASE_URL=senin_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=senin_supabase_key
Geliştirme sunucusunu başlatın:

code
Bash
npm run dev
🧠 Teknik Mimari Kararları
Performans: Uygulama içerisinde Optimistic UI prensibi uygulanmıştır; kullanıcı bir kartı sürüklediğinde değişiklik arayüzde anında gerçekleşir, veritabanı senkronizasyonu arka planda asenkron olarak tamamlanır.

Modüler Yapı: Board yönetimi useBoard isimli custom hook ile merkezi bir noktadan yönetilerek kod tekrarı önlenmiştir.

Veri Güvenliği: Supabase üzerinde Row Level Security (RLS) politikaları kullanılarak, her kullanıcının sadece yetkisi olduğu verilere erişmesi sağlanmıştır.

Erişibilirlik: Sürükle bırak işlemleri için klavye ve dokunmatik ekran desteği önceliklendirilmiştir.

📜 Lisans
Bu proje MIT Lisansı ile lisanslanmıştır. Hackathon ruhuna uygun olarak açık kaynaklıdır.
