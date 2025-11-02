# Kişisel Asistan

Notlar, yapılacaklar ve hatırlatmalarınız için AI destekli kişisel asistan web uygulaması.

## Repository

Bu projenin kaynak kodu: [https://github.com/incesuali/asistan.git](https://github.com/incesuali/asistan.git)

## Özellikler

- 📝 **4 Panelli Arayüz**: Notlar, Yapılacaklar, Hatırlatmalar ve ek panel
- 🤖 **AI Sohbet**: Groq AI ile Türkçe konuşma desteği
- 🎨 **Minimalist Tasarım**: Temiz, beyaz tema, küçük fontlar
- 💬 **Akıllı Popup**: Ekranın ortasında açılan chat modal'ı
- ⚡ **Hızlı**: Groq'un hızlı API'si sayesinde düşük gecikme
- 🔔 **Akıllı Hatırlatma Sistemi**: Zamanlanmış hatırlatmalar ve otomatik popup bildirimleri

## Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
npm install
```

### 2. Groq API Anahtarını Alın

1. [Groq Console](https://console.groq.com/) 'a gidin
2. Hesap oluşturun/giriş yapın
3. API Key oluşturun

### 3. Çevre Değişkenlerini Ayarlayın

`.env.local` dosyasını düzenleyin:

```env
GROQ_API_KEY=your_groq_api_key_here
```

### 4. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

## Teknolojiler

- **Next.js 16**: React framework
- **TypeScript**: Tip güvenliği
- **Tailwind CSS**: Modern CSS framework
- **Groq AI**: Hızlı LLM API
- **Zod**: Validasyon

## Kullanım

### Chat Modal'ı Açma

Sağ alt köşedeki chat ikonuna tıklayarak AI asistanıyla konuşabilirsiniz.

### Özellikler

- **Notlar**: Ekleme, görüntüleme ve silme
- **Yapılacaklar**: Liste oluşturma ve takip
- **Hatırlatmalar**: Zamanlanmış hatırlatma sistemi
- **AI Sohbet**: Doğal dilde iletişim

### Hatırlatma Sistemi

Hatırlatma sistemi şu özelliklere sahiptir:

#### Nasıl Çalışır?
1. **Hatırlatma Ekleme**: 
   - Hatırlatmalar panelinde "Ekle" butonuna tıklayın
   - Hatırlatma metnini yazın
   - Tarih ve saat seçin (datetime picker)
   - "Kaydet" ile kaydedin

2. **Otomatik Popup**:
   - Hatırlatma zamanından **24 saat önce** popup açılmaya başlar
   - Browser açıksa anında kontrol edilir
   - Browser kapalıysa, açıldığında hemen kontrol edilir
   - Her 10 saniyede bir otomatik kontrol yapılır

3. **Popup Davranışı**:
   - Popup sadece "Tamam" butonu ile kapanır (dışına tıklayınca kapanmaz)
   - "Tamam" butonuna basınca hatırlatma `completed: true` olur
   - Tamamlanan hatırlatmalar listede gri renkte ve ✓ işaretiyle gösterilir
   - Tamamlanan hatırlatmalar için popup bir daha açılmaz

4. **Hatırlatma Listesi**:
   - Tüm hatırlatmalar (tamamlanmış olsun olmasın) listede görünür
   - Tamamlanmamış hatırlatmalar normal renkte
   - Tamamlanmış hatırlatmalar gri renkte ve ✓ işaretiyle
   - Hatırlatmalar sadece × butonu ile tamamen silinir

#### Teknik Detaylar
- **Veri Saklama**: LocalStorage (tarayıcıda saklanır)
- **Zaman Kontrolü**: Client-side, her 10 saniyede bir
- **State Yönetimi**: React useState ve useRef
- **Timezone**: Local timezone kullanılır (datetime-local input)

#### Örnek Senaryo
1. Kullanıcı "Yarın saat 15:00 toplantı" hatırlatması ekler
2. Sistem bugün saat 15:00'dan itibaren popup göstermeye başlar
3. Browser açıldığında veya 10 saniye aralıklarla kontrol edilir
4. Popup açılır: "🔔 HATIRLATMA - Yarın saat 15:00 toplantı"
5. Kullanıcı "Tamam" butonuna basar
6. Hatırlatma listede gri renkte görünür, popup bir daha açılmaz

## Gelecek Özellikler

- Veritabanı entegrasyonu (PostgreSQL)
- Kullanıcı kimlik doğrulama
- Gelişmiş AI komutları
- Browser Notification API entegrasyonu (tarayıcı kapalıyken de bildirim)
- PWA desteği (uygulama gibi yükleme)

## Lisans

MIT
