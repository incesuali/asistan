import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { checkRateLimit } from '@/lib/utils';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Rate limiting kontrolü
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip, 60, 60000)) {
      return NextResponse.json(
        { error: 'Çok fazla istek gönderdiniz. Lütfen bir süre bekleyin.' },
        { status: 429 }
      );
    }

    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Mesajlar geçerli değil' },
        { status: 400 }
      );
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Sen kısa ve öz yanıt veren bir yardımcı asistansın. Gereksiz detaylar, kişi isimleri veya ekstra açıklamalar ekleme. Sadece istenen bilgiyi ver.'
        },
        ...messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        }))
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 1024,
    });

    const responseMessage = completion.choices[0]?.message?.content || 'Bir yanıt oluşturulamadı.';

    return NextResponse.json({ message: responseMessage });
  } catch (error: any) {
    console.error('Groq API error:', error);
    return NextResponse.json(
      { error: 'Chat servisi şu anda kullanılamıyor', details: error.message },
      { status: 500 }
    );
  }
}

