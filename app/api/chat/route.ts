import { NextResponse } from 'next/server';

// AI özelliği geçici olarak devre dışı
export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Mesajlar geçerli değil' },
        { status: 400 }
      );
    }

    // AI devre dışı - basit bir mesaj döndür
    return NextResponse.json({ 
      message: 'AI özelliği şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.' 
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Chat servisi şu anda kullanılamıyor' },
      { status: 500 }
    );
  }
}

