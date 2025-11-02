'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Sesli tanıma başlat
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'tr-TR';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        // Otomatik gönder
        setTimeout(() => {
          handleSend(transcript);
        }, 100);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleSend = async (forceInput?: string) => {
    const textToSend = forceInput || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    
    // Komut kontrolü: "notlara kaydet", "yapılacaklara ekle", "hatırlatma" vs.
    const lowerInput = textToSend.toLowerCase().trim();
    
    if (lowerInput.includes('notlara kaydet') || lowerInput.includes('not al') || 
        lowerInput.includes('olarak notlara ekle') || lowerInput.includes('olarak not') || 
        lowerInput.includes('olarak not ekle') || lowerInput.includes('olarak notlara')) {
      // Kullanıcının yazdığını direkt notlara kaydet
      let noteContent = textToSend.replace(/notlara kaydet|not al|olarak notlara ekle|olarak not|olarak not ekle|olarak notlara/gi, '').trim();
      // Sondaki özel karakterleri temizle ($, !, vs)
      noteContent = noteContent.replace(/[!$]+$/g, '').trim();
      if (noteContent) {
        saveToNotes(noteContent);
        setMessages((prev) => [...prev, userMessage, { role: 'assistant', content: '✓ Notlara kaydedildi!' }]);
        setInput('');
      }
      return;
    }
    
    if (lowerInput.includes('yapılacaklara ekle') || lowerInput.includes('yapilacaklar')) {
      const todoContent = textToSend.replace(/yapılacaklara ekle|yapilacaklar/gi, '').trim();
      if (todoContent) {
        saveToTodos(todoContent);
        setMessages((prev) => [...prev, userMessage, { role: 'assistant', content: '✓ Yapılacaklara eklendi!' }]);
        setInput('');
      }
      return;
    }
    
    if (lowerInput.includes('hatırlatma') || lowerInput.includes('hatirlat')) {
      const reminderContent = textToSend.replace(/hatırlatma|hatirlat/gi, '').trim();
      if (reminderContent) {
        saveToReminders(reminderContent);
        setMessages((prev) => [...prev, userMessage, { role: 'assistant', content: '✓ Hatırlatma olarak kaydedildi!' }]);
        setInput('');
      }
      return;
    }

    // Normal sohbet
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Bir hata oluştu.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const saveToNotes = (content: string) => {
    const newNote = {
      id: Date.now().toString(),
      content: content,
      createdAt: new Date().toISOString(),
    };
    const existing = localStorage.getItem('notes');
    const notes = existing ? JSON.parse(existing) : [];
    notes.push(newNote);
    localStorage.setItem('notes', JSON.stringify(notes));
    window.dispatchEvent(new Event('storage'));
  };

  const saveToTodos = (content: string) => {
    const newTodo = {
      id: Date.now().toString(),
      content: content,
      createdAt: new Date().toISOString(),
    };
    const existing = localStorage.getItem('todos');
    const todos = existing ? JSON.parse(existing) : [];
    todos.push(newTodo);
    localStorage.setItem('todos', JSON.stringify(todos));
    window.dispatchEvent(new Event('storage'));
  };

  const saveToReminders = (content: string) => {
    const newReminder = {
      id: Date.now().toString(),
      content: content,
      createdAt: new Date().toISOString(),
    };
    const existing = localStorage.getItem('reminders');
    const reminders = existing ? JSON.parse(existing) : [];
    reminders.push(newReminder);
    localStorage.setItem('reminders', JSON.stringify(reminders));
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 transition-colors flex items-center justify-center z-50"
        aria-label="Chat'i aç"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-xs font-semibold text-gray-800">Asistan ile Konuş</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-xs text-gray-500 mt-8">
                  Merhaba! Size nasıl yardımcı olabilirim?
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex flex-col max-w-[80%]">
                    <div
                      className={`rounded-lg px-3 py-2 text-xs ${
                        msg.role === 'user'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.role === 'assistant' && idx === messages.length - 1 && (
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={(e) => {
                            saveToNotes(msg.content);
                            // Butona tıklandığında görsel geri bildirim
                            const btn = e.currentTarget;
                            if (btn) {
                              const originalText = btn.textContent;
                              btn.textContent = '✓ Kaydedildi!';
                              btn.disabled = true;
                              btn.classList.add('opacity-70');
                              setTimeout(() => {
                                if (originalText) btn.textContent = originalText;
                                btn.disabled = false;
                                btn.classList.remove('opacity-70');
                              }, 1000);
                            }
                          }}
                          className="text-[10px] px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 active:scale-95 transition-transform"
                        >
                          Notlara Kaydet
                        </button>
                        <button
                          onClick={(e) => {
                            saveToTodos(msg.content);
                            const btn = e.currentTarget;
                            if (btn) {
                              const originalText = btn.textContent;
                              btn.textContent = '✓ Kaydedildi!';
                              btn.disabled = true;
                              btn.classList.add('opacity-70');
                              setTimeout(() => {
                                if (originalText) btn.textContent = originalText;
                                btn.disabled = false;
                                btn.classList.remove('opacity-70');
                              }, 1000);
                            }
                          }}
                          className="text-[10px] px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 active:scale-95 transition-transform"
                        >
                          Yapılacaklara Ekle
                        </button>
                        <button
                          onClick={(e) => {
                            saveToReminders(msg.content);
                            const btn = e.currentTarget;
                            if (btn) {
                              const originalText = btn.textContent;
                              btn.textContent = '✓ Kaydedildi!';
                              btn.disabled = true;
                              btn.classList.add('opacity-70');
                              setTimeout(() => {
                                if (originalText) btn.textContent = originalText;
                                btn.disabled = false;
                                btn.classList.remove('opacity-70');
                              }, 1000);
                            }
                          }}
                          className="text-[10px] px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 active:scale-95 transition-transform"
                        >
                          Hatırlatma Olarak Kaydet
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-3 py-2 text-xs text-gray-800">
                    Düşünüyor...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  rows={2}
                  disabled={loading}
                />
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`px-3 py-2 rounded-lg text-xs transition-colors ${
                    isListening 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                  title={isListening ? 'Dinlemeyi durdur' : 'Sesli komut'}
                >
                  {isListening ? '⏹' : '🎤'}
                </button>
                <button
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-xs hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Gönder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

