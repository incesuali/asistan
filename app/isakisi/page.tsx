'use client';

export default function IsAkisiPage() {
  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Üst Bar - Siyah, solda geri butonu */}
      <div className="bg-black text-white px-4 py-4 flex justify-between items-center flex-shrink-0">
        <a 
          href="/" 
          className="text-xs font-light hover:underline"
        >
          ← Ana Sayfa
        </a>
        <div className="text-xs font-light">İş Akışı</div>
      </div>
      
      {/* Boş içerik alanı */}
      <div className="flex-1 overflow-y-auto">
      </div>
    </div>
  );
}

