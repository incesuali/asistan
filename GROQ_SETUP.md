# Groq API Kurulum Rehberi

## 1. Groq Hesabı Oluşturma

1. [Groq Console](https://console.groq.com/) adresine gidin
2. "Sign Up" butonuna tıklayarak yeni bir hesap oluşturun veya "Log In" ile mevcut hesabınıza giriş yapın

## 2. API Key Oluşturma

1. Giriş yaptıktan sonra dashboard'a yönlendirileceksiniz
2. Üst menüden "API Keys" sekmesine gidin
3. "Create API Key" butonuna tıklayın
4. API anahtarınıza bir isim verin (örn: "Asistan Projesi")
5. Oluşturulan API key'i kopyalayın **⚠️ ÖNEMLİ**: Bu anahtarı sadece bir kez göreceksiniz!

## 3. Projeye API Key Ekleme

1. Projenin ana dizininde `.env.local` dosyasını açın
2. Aşağıdaki satırı bulun:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```
3. `your_groq_api_key_here` kısmını Groq'dan aldığınız API key ile değiştirin:
   ```
   GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
4. Dosyayı kaydedin

## 4. Uygulamayı Yeniden Başlatma

API key'i ekledikten sonra development server'ı yeniden başlatmanız gerekir:

```bash
# Terminal'de Ctrl+C ile durdurun, sonra:
npm run dev
```

## Notlar

- ✅ Groq API kullanımı tamamen ücretsizdir (belirli limitler içinde)
- ✅ API key'lerinizi asla public repository'lere commit etmeyin
- ✅ `.env.local` dosyası `.gitignore` içinde olduğu için otomatik olarak ignore edilir
- ✅ Groq, Türkçe dil desteği sağlar (Llama modelleri sayesinde)

## Sorun Giderme

### "Invalid API key" hatası
- API key'i doğru kopyaladığınızdan emin olun
- `.env.local` dosyasında boşluk veya fazladan karakter olmadığını kontrol edin
- Server'ı yeniden başlattığınızdan emin olun

### "Rate limit exceeded" hatası
- Çok fazla istek gönderiyorsunuz
- Birkaç saniye bekleyip tekrar deneyin
- Groq ücretsiz plan limitlerini kontrol edin

## Daha Fazla Bilgi

- [Groq Resmi Dokümantasyon](https://console.groq.com/docs)
- [Groq Discord Topluluğu](https://discord.gg/groq)

