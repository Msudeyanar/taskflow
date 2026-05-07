# TaskFlow  - Kanban Proje Yönetim Tahtası

TaskFlow, yazılım ve tasarım ekiplerinin görevlerini kolayca takip edip yönetebilmeleri için geliştirilmiş, Trello benzeri, modern ve yüksek performanslı bir Kanban pano (board) uygulamasıdır. 

Bu proje, **Hackathon Görev Yönetim Aracı** konsepti doğrultusunda 48 saatlik bir zaman diliminde sıfırdan geliştirilmiştir.

![TaskFlow Screenshot](./public/window.svg)

## ✨ Öne Çıkan Özellikler

- **Gelişmiş Sürükle ve Bırak (Drag & Drop):** Hem görev kartlarını (Card) hem de sütunları (Column) dilediğiniz gibi sürükleyip bırakabilirsiniz. Mobil cihazlarla da (touch sensor) tam uyumludur.
- **O(1) Performanslı Sıralama (Fractional Indexing):** Sürükle-bırak sonrası veritabanında yüzlerce kaydı güncellemek yerine, araya giren kartlara kesirli/alfabetik değerler atanarak (Jira & Trello mantığı) inanılmaz bir performans artışı sağlandı.
- **Detaylı Görev Yönetimi:** Kartlara Başlık, Açıklama, Öncelik (Düşük/Orta/Yüksek), Sorumlu Kişi, Renkli Etiketler ve Teslim Tarihi eklenebilmektedir.
- **Takvim Görünümü (Calendar View):** Teslim tarihi girilmiş tüm görevler, özel bir takvim arayüzünde aşamalarına ve renklerine göre görüntülenebilir.
- **Takım Yönetimi:** Sisteme kayıtlı kullanıcılar e-posta adresleri üzerinden bulunup "Takım Arkadaşı" olarak eklenebilir ve görevlere atanabilir.
- **Kimlik Doğrulama (Auth):** Supabase destekli güvenli kayıt ve giriş sistemi.
- **Offline & Fallback Desteği:** Sunucu bağlantısı kurulamadığında `localStorage` üzerinden çalışmaya devam edebilme (veri kaybını önleme) altyapısı.

## 🛠️ Kullanılan Teknolojiler

- **Frontend:** Next.js 15 (App Router), React, TypeScript
- **Stilleme & UI:** Tailwind CSS, Lucide Icons, date-fns, shadcn/ui (temel bileşenler)
- **Drag & Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`
- **Backend & Veritabanı:** Supabase (PostgreSQL, Row Level Security, Triggers)
- **Deployment:** Vercel

## 🚀 Kurulum ve Çalıştırma

Projeyi bilgisayarınızda yerel olarak çalıştırmak için aşağıdaki adımları izleyin:

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/KULLANICI_ADIN/taskflow.git
cd taskflow
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Çevresel Değişkenleri (Environment Variables) Ayarlayın
Projenin kök dizininde `.env.local` adında bir dosya oluşturun ve Supabase bilgilerinizi ekleyin:
```env
NEXT_PUBLIC_SUPABASE_URL=senin_supabase_url_adresin
NEXT_PUBLIC_SUPABASE_ANON_KEY=senin_supabase_anon_key_degerin
```

### 4. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```
Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresine giderek uygulamayı görüntüleyebilirsiniz.

## Teknik Mimari Kararları (Jüri İçin Notlar)

- **Sürükle Bırak Kütüphanesi:** Bakımı durdurulan `react-beautiful-dnd` yerine güncel ve modern bir React ekosistemi olan `@dnd-kit` tercih edilmiştir. Modüler yapısı sayesinde uygulama boyutu şişirilmemiştir.
- **State Yönetimi:** Board state'i `useBoard` isimli custom bir hook içerisinde merkezi olarak yönetilmektedir. Supabase verisi ile local state senkronizasyonu optimistik (optimistic UI) güncellemelerle sağlanarak kullanıcıya bekleme hissi yaşatılmaz.
- **Veritabanı Tasarımı:** `boards` -> `columns` -> `cards` şeklinde 3'lü ilişki (Foreign Key & CASCADE DELETE) kullanılmıştır.
- **Profil Senkronizasyonu:** Supabase Auth üzerinde yeni kullanıcı kayıt olduğunda, veritabanındaki `profiles` tablosuna otomatik olarak e-posta ve id bilgisini yazan bir "Postgres Trigger" yazılmıştır. Bu sayede kullanıcılar birbirlerini email ile arayabilmektedir.

## 📜 Lisans

Bu proje MIT lisansı ile lisanslanmıştır. Hackathon amaçlı açık kaynak olarak geliştirilmiştir.
