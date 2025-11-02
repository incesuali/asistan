'use client';

import { useState, useEffect, useRef } from 'react';
import ChatModal from './components/ChatModal';
import ScreenSaver from './components/ScreenSaver';

interface Note {
  id: string;
  content: string;
  createdAt: string;
}

interface Reminder {
  id: string;
  content: string;
  createdAt: string;
  reminderDateTime: string; // ISO format: "2024-11-03T15:00:00"
  completed: boolean; // false = henüz gösterilmedi, true = tamamlandı
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [todos, setTodos] = useState<Note[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [todosModalOpen, setTodosModalOpen] = useState(false);
  const [remindersModalOpen, setRemindersModalOpen] = useState(false);
  const [notesInput, setNotesInput] = useState('');
  const [todosInput, setTodosInput] = useState('');
  const [remindersInput, setRemindersInput] = useState('');
  const [reminderDateTimeInput, setReminderDateTimeInput] = useState('');
  const [activeReminderPopup, setActiveReminderPopup] = useState<Reminder | null>(null);
  const activeReminderPopupRef = useRef<Reminder | null>(null);
  
  // Düzenleme state'leri
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingTodo, setEditingTodo] = useState<Note | null>(null);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [editNoteInput, setEditNoteInput] = useState('');
  const [editTodoInput, setEditTodoInput] = useState('');
  const [editReminderInput, setEditReminderInput] = useState('');
  const [editReminderDateTime, setEditReminderDateTime] = useState('');
  
  // Ekran koruyucusu state'leri
  const [screenSaverActive, setScreenSaverActive] = useState(true); // İlk yüklemede açık
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const IDLE_TIME = 8000; // 8 saniye (test için)

  useEffect(() => {
    // Gerçek zamanlı tarih güncelleme
    const updateDate = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      };
      setCurrentDate(now.toLocaleDateString('tr-TR', options));
    };

    updateDate();
    const interval = setInterval(updateDate, 1000); // Her saniye güncelle

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // LocalStorage'dan verileri yükle
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) setNotes(JSON.parse(savedNotes));

    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) setTodos(JSON.parse(savedTodos));

    const savedReminders = localStorage.getItem('reminders');
    if (savedReminders) {
      try {
        const parsed = JSON.parse(savedReminders);
        // Reminder tipinde olduğundan emin ol (eski Note tipindeki verileri filtrele)
        const validReminders: Reminder[] = parsed.filter((r: any) => 
          r && typeof r === 'object' && r.id && r.content
        ).map((r: any) => ({
          ...r,
          completed: r.completed ?? false,
          reminderDateTime: r.reminderDateTime || r.createdAt, // Eski veriler için fallback
        }));
        setReminders(validReminders);
      } catch (e) {
        console.error('Reminders parse error:', e);
        setReminders([]);
      }
    }

    // Storage değişikliklerini dinle
    const handleStorageChange = () => {
      const savedNotes = localStorage.getItem('notes');
      if (savedNotes) setNotes(JSON.parse(savedNotes));
      
      const savedTodos = localStorage.getItem('todos');
      if (savedTodos) setTodos(JSON.parse(savedTodos));
      
      const savedReminders = localStorage.getItem('reminders');
      if (savedReminders) setReminders(JSON.parse(savedReminders));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // checkReminders fonksiyonunu component seviyesine çıkar (hem useEffect hem saveReminder'dan çağrılabilmesi için)
  const checkReminders = () => {
    const now = new Date();
    
    // Reminders'ı localStorage'dan direkt al (state closure sorununu çöz)
    const savedReminders = localStorage.getItem('reminders');
    const currentReminders: Reminder[] = savedReminders ? JSON.parse(savedReminders) : [];
    
    // Sadece tamamlanmamış (completed: false) ve zamanı gelmiş hatırlatmaları kontrol et
    const activeReminders = currentReminders.filter(r => !r.completed && r.reminderDateTime);
    
    // Eğer zaten bir popup açıksa, yeni kontrol yapma (popup tamamlanana kadar bekler)
    if (activeReminderPopupRef.current) return;
    
    // Aktif hatırlatmaları kontrol et
    for (const reminder of activeReminders) {
      if (!reminder.reminderDateTime) continue;
      
      const reminderTime = new Date(reminder.reminderDateTime);
      const notifyTime = new Date(reminderTime.getTime() - 24 * 60 * 60 * 1000); // 24 saat önce
      
      // Popup açılma mantığı:
      // notifyTime = hatırlatma zamanı - 24 saat
      // Popup sadece: şu anki zaman >= notifyTime olduğunda açılır
      
      // notifyTime ile şu anki zaman arasındaki fark
      const timeDiff = notifyTime.getTime() - now.getTime();
      
      // Eğer notifyTime henüz gelmemişse (gelecekteyse), popup açma
      if (timeDiff > 0) {
        // notifyTime henüz gelmedi, popup açılmayacak
        continue;
      }
      
      // notifyTime geldi veya geçti, popup aç
      setActiveReminderPopup(reminder);
      activeReminderPopupRef.current = reminder;
      break; // İlk uygun hatırlatmayı göster ve dur
    }
  };

  useEffect(() => {
    // Sayfa yüklendiğinde hemen kontrol et (browser açıldığında)
    checkReminders();
    
    // Her 10 saniyede bir kontrol et (browser açıksa)
    const interval = setInterval(checkReminders, 10000); // 10000ms = 10 saniye
    
    return () => clearInterval(interval);
  }, [reminders]);

  // Mouse hareketi takibi - Ekran koruyucusu için
  useEffect(() => {
    const resetIdleTimer = () => {
      // Ekran koruyucusu açıksa, mouse hareketi ile kapatma (sadece 11 butonu ile kapatılacak)
      if (screenSaverActive) {
        return;
      }
      
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      
      idleTimerRef.current = setTimeout(() => {
        setScreenSaverActive(true);
      }, IDLE_TIME);
    };

    // İlk kurulum
    resetIdleTimer();

    // Mouse ve klavye hareketi event listener'ları
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer);
    });

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [screenSaverActive]);

  const deleteNote = (id: string, type: 'notes' | 'todos' | 'reminders') => {
    const storageKey = type;
    if (type === 'notes') {
      const updated = notes.filter(n => n.id !== id);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setNotes(updated);
    } else if (type === 'todos') {
      const updated = todos.filter(n => n.id !== id);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setTodos(updated);
    } else {
      const updated = reminders.filter(n => n.id !== id);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setReminders(updated);
    }
    window.dispatchEvent(new Event('storage'));
  };

  const saveNote = () => {
    if (!notesInput.trim()) return;
    const newNote = {
      id: Date.now().toString(),
      content: notesInput.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...notes, newNote];
    localStorage.setItem('notes', JSON.stringify(updated));
    setNotes(updated);
    setNotesInput('');
    setNotesModalOpen(false);
    window.dispatchEvent(new Event('storage'));
  };

  const saveTodo = () => {
    if (!todosInput.trim()) return;
    const newTodo = {
      id: Date.now().toString(),
      content: todosInput.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...todos, newTodo];
    localStorage.setItem('todos', JSON.stringify(updated));
    setTodos(updated);
    setTodosInput('');
    setTodosModalOpen(false);
    window.dispatchEvent(new Event('storage'));
  };

  const saveReminder = () => {
    if (!remindersInput.trim() || !reminderDateTimeInput) return;
    
    // datetime-local input'u direkt Date objesine çevir
    // Bu zaten local timezone'da çalışır
    const reminderDate = new Date(reminderDateTimeInput);
    const dateTimeISO = reminderDate.toISOString();
    
    const newReminder: Reminder = {
      id: Date.now().toString(),
      content: remindersInput.trim(),
      reminderDateTime: dateTimeISO,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [...reminders, newReminder];
    localStorage.setItem('reminders', JSON.stringify(updated));
    setReminders(updated);
    setRemindersInput('');
    setReminderDateTimeInput('');
    setRemindersModalOpen(false);
    
    // Yeni eklenen hatırlatma için hemen kontrol et (browser yenilemeden popup açılsın)
    setTimeout(() => {
      checkReminders();
    }, 100); // State güncellemesinin tamamlanması için kısa bir gecikme
    
    window.dispatchEvent(new Event('storage'));
  };

  const completeReminder = (id: string) => {
    const updated = reminders.map(r => 
      r.id === id ? { ...r, completed: true } : r
    );
    localStorage.setItem('reminders', JSON.stringify(updated));
    setReminders(updated);
    setActiveReminderPopup(null);
    activeReminderPopupRef.current = null;
    window.dispatchEvent(new Event('storage'));
  };

  // Düzenleme fonksiyonları
  const startEditNote = (note: Note) => {
    setEditingNote(note);
    setEditNoteInput(note.content);
  };

  const saveEditNote = () => {
    if (!editingNote || !editNoteInput.trim()) return;
    const updated = notes.map(n => 
      n.id === editingNote.id ? { ...n, content: editNoteInput.trim() } : n
    );
    localStorage.setItem('notes', JSON.stringify(updated));
    setNotes(updated);
    setEditingNote(null);
    setEditNoteInput('');
    window.dispatchEvent(new Event('storage'));
  };

  const startEditTodo = (todo: Note) => {
    setEditingTodo(todo);
    setEditTodoInput(todo.content);
  };

  const saveEditTodo = () => {
    if (!editingTodo || !editTodoInput.trim()) return;
    const updated = todos.map(t => 
      t.id === editingTodo.id ? { ...t, content: editTodoInput.trim() } : t
    );
    localStorage.setItem('todos', JSON.stringify(updated));
    setTodos(updated);
    setEditingTodo(null);
    setEditTodoInput('');
    window.dispatchEvent(new Event('storage'));
  };

  const startEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setEditReminderInput(reminder.content);
    // datetime-local formatına çevir (YYYY-MM-DDTHH:mm)
    const date = new Date(reminder.reminderDateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    setEditReminderDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
  };

  const saveEditReminder = () => {
    if (!editingReminder || !editReminderInput.trim() || !editReminderDateTime) return;
    
    const reminderDate = new Date(editReminderDateTime);
    const dateTimeISO = reminderDate.toISOString();
    
    const updated = reminders.map(r => 
      r.id === editingReminder.id ? { ...r, content: editReminderInput.trim(), reminderDateTime: dateTimeISO } : r
    );
    localStorage.setItem('reminders', JSON.stringify(updated));
    setReminders(updated);
    setEditingReminder(null);
    setEditReminderInput('');
    setEditReminderDateTime('');
    
    // Hatırlatma zamanı değişti, kontrol et
    setTimeout(() => {
      checkReminders();
    }, 100);
    
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <>
      {/* Ekran Koruyucusu */}
      {screenSaverActive && (
        <ScreenSaver 
          isActive={screenSaverActive} 
          onDismiss={() => {
            setScreenSaverActive(false);
            // Timer'ı sıfırla
            if (idleTimerRef.current) {
              clearTimeout(idleTimerRef.current);
            }
            // Yeni timer başlat
            idleTimerRef.current = setTimeout(() => {
              setScreenSaverActive(true);
            }, IDLE_TIME);
          }} 
        />
      )}
      
      <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Üst Bar - Siyah, tarih sağda */}
      <div className="bg-black text-white px-4 py-4 flex justify-end items-center flex-shrink-0">
        <span className="text-xs font-light">{currentDate}</span>
      </div>
      
      <div className="grid grid-cols-2 grid-rows-2 flex-1 min-h-0 overflow-hidden">
        {/* Sol üst - Notlar */}
        <div className="border-r border-b border-gray-200 p-4 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <h2 className="text-xs font-light text-gray-600 uppercase tracking-wide">Notlar</h2>
            <button
              onClick={() => setNotesModalOpen(true)}
              className="text-xs text-gray-600 hover:text-gray-900 transition-colors px-1"
            >
              Ekle
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 -mx-4 px-4">
            {notes.length === 0 ? (
              <div className="text-xs text-gray-400 italic">Henüz not yok</div>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="text-xs text-gray-700 leading-normal whitespace-pre-wrap group py-0.5">
                  {note.content}
                  <button
                    onClick={() => startEditNote(note)}
                    className="ml-2 text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Düzenle"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => deleteNote(note.id, 'notes')}
                    className="ml-1 text-[10px] text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Sil"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sağ üst - Yapılacaklar */}
        <div className="border-b border-gray-200 p-4 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <h2 className="text-xs font-light text-gray-600 uppercase tracking-wide">Yapılacaklar</h2>
            <button
              onClick={() => setTodosModalOpen(true)}
              className="text-xs text-gray-600 hover:text-gray-900 transition-colors px-1"
            >
              Ekle
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 -mx-4 px-4">
            {todos.length === 0 ? (
              <div className="text-xs text-gray-400 italic">Henüz yapılacak yok</div>
            ) : (
              todos.map((todo) => (
                <div key={todo.id} className="text-xs text-gray-700 leading-normal whitespace-pre-wrap group py-0.5">
                  {todo.content}
                  <button
                    onClick={() => startEditTodo(todo)}
                    className="ml-2 text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Düzenle"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => deleteNote(todo.id, 'todos')}
                    className="ml-1 text-[10px] text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Sil"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sol alt - Hatırlatmalar */}
        <div className="border-r border-gray-200 p-4 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <h2 className="text-xs font-light text-gray-600 uppercase tracking-wide">Hatırlatmalar</h2>
            <button
              onClick={() => setRemindersModalOpen(true)}
              className="text-xs text-gray-600 hover:text-gray-900 transition-colors px-1"
            >
              Ekle
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 -mx-4 px-4">
            {reminders.filter(r => r.reminderDateTime).length === 0 ? (
              <div className="text-xs text-gray-400 italic">Henüz hatırlatma yok</div>
            ) : (
              reminders
                .filter(r => r.reminderDateTime)
                .map((reminder) => (
                <div key={reminder.id} className={`text-xs leading-normal whitespace-pre-wrap group py-0.5 ${reminder.completed ? 'text-red-600' : 'text-green-600'}`}>
                  {reminder.content}
                  {reminder.reminderDateTime && (
                    <span className="ml-2 text-[10px] text-gray-400">
                      {new Date(reminder.reminderDateTime).toLocaleString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {reminder.completed && ' ✓'}
                    </span>
                  )}
                  <button
                    onClick={() => startEditReminder(reminder)}
                    className="ml-2 text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Düzenle"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => deleteNote(reminder.id, 'reminders')}
                    className="ml-1 text-[10px] text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Sil"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sağ alt - Boş */}
        <div className="p-4 flex flex-col overflow-hidden">
          <h2 className="text-xs font-light text-gray-600 mb-3 uppercase tracking-wide flex-shrink-0">...</h2>
          <div className="flex-1 overflow-y-auto space-y-1 -mx-4 px-4">
            <div className="text-xs text-gray-400 italic">
              Henüz belirlenmedi
            </div>
          </div>
        </div>
      </div>
      
      {/* Notlar Modal */}
      {notesModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setNotesModalOpen(false);
              setNotesInput('');
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4">
            <h3 className="text-xs font-semibold text-gray-800 mb-3">Yeni Not Ekle</h3>
            <textarea
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  saveNote();
                }
              }}
              placeholder="Notunuzu yazın..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent mb-3"
              rows={4}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setNotesModalOpen(false);
                  setNotesInput('');
                }}
                className="text-xs px-3 py-1.5 text-gray-600 hover:text-gray-800 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={saveNote}
                disabled={!notesInput.trim()}
                className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yapılacaklar Modal */}
      {todosModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setTodosModalOpen(false);
              setTodosInput('');
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4">
            <h3 className="text-xs font-semibold text-gray-800 mb-3">Yeni Yapılacak Ekle</h3>
            <textarea
              value={todosInput}
              onChange={(e) => setTodosInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  saveTodo();
                }
              }}
              placeholder="Yapılacakları yazın..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent mb-3"
              rows={4}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setTodosModalOpen(false);
                  setTodosInput('');
                }}
                className="text-xs px-3 py-1.5 text-gray-600 hover:text-gray-800 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={saveTodo}
                disabled={!todosInput.trim()}
                className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hatırlatmalar Modal */}
      {remindersModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setRemindersModalOpen(false);
              setRemindersInput('');
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4">
            <h3 className="text-xs font-semibold text-gray-800 mb-3">Yeni Hatırlatma Ekle</h3>
            <textarea
              value={remindersInput}
              onChange={(e) => setRemindersInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  saveReminder();
                }
              }}
              placeholder="Hatırlatmanızı yazın..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent mb-3"
              rows={4}
              autoFocus
            />
            <input
              type="datetime-local"
              value={reminderDateTimeInput}
              onChange={(e) => setReminderDateTimeInput(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent mb-3"
              required
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setRemindersModalOpen(false);
                  setRemindersInput('');
                  setReminderDateTimeInput('');
                }}
                className="text-xs px-3 py-1.5 text-gray-600 hover:text-gray-800 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={saveReminder}
                disabled={!remindersInput.trim() || !reminderDateTimeInput}
                className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notlar Düzenleme Modal */}
      {editingNote && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingNote(null);
              setEditNoteInput('');
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4">
            <h3 className="text-xs font-semibold text-gray-800 mb-3">Notu Düzenle</h3>
            <textarea
              value={editNoteInput}
              onChange={(e) => setEditNoteInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  saveEditNote();
                }
              }}
              placeholder="Notunuzu yazın..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent mb-3"
              rows={4}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setEditingNote(null);
                  setEditNoteInput('');
                }}
                className="text-xs px-3 py-1.5 text-gray-600 hover:text-gray-800 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={saveEditNote}
                disabled={!editNoteInput.trim()}
                className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yapılacaklar Düzenleme Modal */}
      {editingTodo && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingTodo(null);
              setEditTodoInput('');
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4">
            <h3 className="text-xs font-semibold text-gray-800 mb-3">Yapılacakları Düzenle</h3>
            <textarea
              value={editTodoInput}
              onChange={(e) => setEditTodoInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  saveEditTodo();
                }
              }}
              placeholder="Yapılacakları yazın..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent mb-3"
              rows={4}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setEditingTodo(null);
                  setEditTodoInput('');
                }}
                className="text-xs px-3 py-1.5 text-gray-600 hover:text-gray-800 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={saveEditTodo}
                disabled={!editTodoInput.trim()}
                className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hatırlatmalar Düzenleme Modal */}
      {editingReminder && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingReminder(null);
              setEditReminderInput('');
              setEditReminderDateTime('');
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4">
            <h3 className="text-xs font-semibold text-gray-800 mb-3">Hatırlatmayı Düzenle</h3>
            <textarea
              value={editReminderInput}
              onChange={(e) => setEditReminderInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  saveEditReminder();
                }
              }}
              placeholder="Hatırlatmanızı yazın..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent mb-3"
              rows={4}
              autoFocus
            />
            <input
              type="datetime-local"
              value={editReminderDateTime}
              onChange={(e) => setEditReminderDateTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent mb-3"
              required
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setEditingReminder(null);
                  setEditReminderInput('');
                  setEditReminderDateTime('');
                }}
                className="text-xs px-3 py-1.5 text-gray-600 hover:text-gray-800 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={saveEditReminder}
                disabled={!editReminderInput.trim() || !editReminderDateTime}
                className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Popup - Hatırlatma zamanı geldiğinde göster */}
      {activeReminderPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          {/* Popup dışına tıklanınca kapanmaz, sadece Tamam butonu ile kapanır */}
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <h3 className="text-sm font-semibold text-gray-800 uppercase">HATIRLATMA</h3>
            </div>
            <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">
              {activeReminderPopup.content}
            </div>
            <button
              onClick={() => completeReminder(activeReminderPopup.id)}
              className="w-full bg-gray-900 text-white px-4 py-2 rounded text-xs hover:bg-gray-800 transition-colors"
            >
              Tamam
            </button>
          </div>
        </div>
      )}
      
      {/* Chat Modal - Ekranın ortasında */}
      <ChatModal />
      </div>
    </>
  );
}
