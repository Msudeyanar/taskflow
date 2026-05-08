TaskFlow - Kanban Proje Yönetim Tahtası
TaskFlow, yazılım ve tasarım ekiplerinin görevlerini kolayca takip edip yönetebilmeleri için geliştirilmiş, Trello benzeri, modern ve yüksek performanslı bir Kanban pano (board) uygulamasıdır.

Canlı Proje: https://taskflow-kappa-black.vercel.app

Bu proje, Hackathon Görev Yönetim Aracı konsepti doğrultusunda 48 saatlik bir zaman diliminde sıfırdan geliştirilmiştir.

✨ Öne Çıkan Özellikler
Gelişmiş Sürükle ve Bırak (Drag & Drop): Hem görev kartlarını (Card) hem de sütunları (Column) dilediğiniz gibi sürükleyip bırakabilirsiniz. Mobil cihazlarla (touch sensor) tam uyumludur.

Performans Odaklı Sıralama: Sürükle-bırak sonrası veritabanı senkronizasyonu optimize edilerek, kullanıcıya bekleme hissi yaşatmadan akıcı bir deneyim sunulur.

Detaylı Görev Yönetimi: Kartlara Başlık, Açıklama, Öncelik (Düşük/Orta/Yüksek), Sorumlu Kişi, Renkli Etiketler ve Teslim Tarihi eklenebilmektedir.

Takvim Görünümü (Calendar View): Teslim tarihi girilmiş tüm görevler, özel bir takvim arayüzünde aşamalarına ve renklerine göre görüntülenebilir.

Takım Yönetimi: Sisteme kayıtlı kullanıcılar e-posta adresleri üzerinden bulunup "Takım Arkadaşı" olarak eklenebilir ve görevlere atanabilir.

Kimlik Doğrulama (Auth): Supabase Auth destekli güvenli kayıt ve giriş sistemi.

Offline & Fallback Desteği: Sunucu bağlantısı kurulamadığında localStorage üzerinden son durumu koruma ve veri kaybını önleme altyapısı.

🛠️ Kullanılan Teknolojiler
Frontend: Next.js 15 (App Router), React, TypeScript

Stilleme & UI: Tailwind CSS, Lucide Icons, date-fns, shadcn/ui

Drag & Drop: @dnd-kit/core, @dnd-kit/sortable

Backend & Veritabanı: Supabase (PostgreSQL, Row Level Security)

Deployment: Vercel

🚀 Kurulum ve Çalıştırma
Projeyi bilgisayarınızda yerel olarak çalıştırmak için aşağıdaki adımları izleyin:

1. Depoyu Klonlayın
code
Bash
git clone https://github.com/KULLANICI_ADIN/taskflow.git
cd taskflow
2. Bağımlılıkları Yükleyin
code
Bash
npm install
3. Çevresel Değişkenleri Ayarlayın
Projenin kök dizininde .env.local dosyası oluşturun ve Supabase bilgilerinizi ekleyin:

code
Env
NEXT_PUBLIC_SUPABASE_URL=senin_supabase_url_adresin
NEXT_PUBLIC_SUPABASE_ANON_KEY=senin_supabase_anon_key_degerin
4. Geliştirme Sunucusunu Başlatın
code
Bash
npm run dev
Teknik Mimari Kararları (Jüri İçin Notlar)
Sürükle Bırak Kütüphanesi: Bakımı durdurulan eski kütüphaneler yerine, modern ve erişilebilir bir yapı sunan @dnd-kit tercih edilmiştir.

State Yönetimi: Board state'i özel bir hook (useBoard) içerisinde merkezi olarak yönetilmektedir. Optimistic UI yaklaşımı ile sürükleme işlemi bittiği anda veritabanı cevabı beklenmeden arayüz güncellenir.

Veritabanı Tasarımı: boards -> columns -> cards şeklinde ilişkisel bir yapı kurulmuştur. Silme işlemlerinde CASCADE DELETE kullanılarak veri bütünlüğü korunmuştur.

Güvenlik: Supabase üzerinde Row Level Security (RLS) politikaları aktif edilerek, kullanıcıların sadece kendi dahil oldukları panoları görmesi ve düzenlemesi sağlanmıştır.
