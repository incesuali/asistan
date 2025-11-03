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
    // API'den verileri yükle ve LocalStorage'dan migrate et
    const loadData = async () => {
      try {
        // Önce LocalStorage'dan verileri al
        const localNotes = localStorage.getItem('notes');
        const localTodos = localStorage.getItem('todos');
        const localReminders = localStorage.getItem('reminders');

        let parsedNotes: Note[] = [];
        let parsedTodos: Note[] = [];
        let parsedReminders: Reminder[] = [];

        if (localNotes) {
          try {
            parsedNotes = JSON.parse(localNotes);
          } catch (e) {
            console.error('Notes parse error:', e);
          }
        }

        if (localTodos) {
          try {
            parsedTodos = JSON.parse(localTodos);
          } catch (e) {
            console.error('Todos parse error:', e);
          }
        }

        if (localReminders) {
          try {
            const parsed = JSON.parse(localReminders);
            parsedReminders = parsed.filter((r: any) => 
              r && typeof r === 'object' && r.id && r.content
            ).map((r: any) => ({
              ...r,
              completed: r.completed ?? false,
              reminderDateTime: r.reminderDateTime || r.createdAt,
            }));
          } catch (e) {
            console.error('Reminders parse error:', e);
          }
        }

        // Eğer LocalStorage'da veri varsa, veritabanına taşı
        if (parsedNotes.length > 0 || parsedTodos.length > 0 || parsedReminders.length > 0) {
          try {
            await fetch('/api/migrate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                notes: parsedNotes,
                todos: parsedTodos,
                reminders: parsedReminders,
              }),
            });
            
            // Migration sonrası LocalStorage'ı temizle
            if (parsedNotes.length > 0) localStorage.removeItem('notes');
            if (parsedTodos.length > 0) localStorage.removeItem('todos');
            if (parsedReminders.length > 0) localStorage.removeItem('reminders');
          } catch (error) {
            console.error('Migration error:', error);
          }
        }

        // API'den verileri yükle
        // Notes
        const notesRes = await fetch('/api/notes');
        if (notesRes.ok) {
          const notesData = await notesRes.json();
          setNotes(notesData.map((n: any) => ({
            id: n.id,
            content: n.content,
            createdAt: n.created_at || n.createdAt,
          })));
        }

        // Todos
        const todosRes = await fetch('/api/todos');
        if (todosRes.ok) {
          const todosData = await todosRes.json();
          setTodos(todosData.map((t: any) => ({
            id: t.id,
            content: t.content,
            createdAt: t.created_at || t.createdAt,
          })));
        }

        // Reminders
        const remindersRes = await fetch('/api/reminders');
        if (remindersRes.ok) {
          const remindersData = await remindersRes.json();
          setReminders(remindersData.map((r: any) => ({
            id: r.id,
            content: r.content,
            reminderDateTime: r.reminderDateTime,
            completed: r.completed ?? false,
            createdAt: r.created_at || r.createdAt,
          })));
        }
      } catch (error) {
        console.error('Data load error:', error);
      }
    };

    loadData();
  }, []);

  // checkReminders fonksiyonunu component seviyesine çıkar (hem useEffect hem saveReminder'dan çağrılabilmesi için)
  const checkReminders = async () => {
    const now = new Date();
    
    // Reminders'ı API'den direkt al (state closure sorununu çöz)
    try {
      const remindersRes = await fetch('/api/reminders');
      if (!remindersRes.ok) return;
      
      const savedReminders = await remindersRes.json();
      const currentReminders: Reminder[] = savedReminders.map((r: any) => ({
        id: r.id,
        content: r.content,
        reminderDateTime: r.reminderDateTime,
        completed: r.completed ?? false,
        createdAt: r.createdAt || r.created_at,
      }));
      
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
    } catch (error) {
      console.error('checkReminders error:', error);
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

  const deleteNote = async (id: string, type: 'notes' | 'todos' | 'reminders') => {
    try {
      const endpoint = type === 'notes' ? '/api/notes' : type === 'todos' ? '/api/todos' : '/api/reminders';
      const res = await fetch(`${endpoint}?id=${id}`, { method: 'DELETE' });
      
      if (res.ok) {
        if (type === 'notes') {
          setNotes(notes.filter(n => n.id !== id));
        } else if (type === 'todos') {
          setTodos(todos.filter(n => n.id !== id));
        } else {
          setReminders(reminders.filter(n => n.id !== id));
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const saveNote = async () => {
    if (!notesInput.trim()) return;
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: notesInput.trim() }),
      });
      
      if (res.ok) {
        const newNote = await res.json();
        setNotes([...notes, { ...newNote, createdAt: new Date().toISOString() }]);
        setNotesInput('');
        setNotesModalOpen(false);
      }
    } catch (error) {
      console.error('Save note error:', error);
    }
  };

  const saveTodo = async () => {
    if (!todosInput.trim()) return;
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: todosInput.trim() }),
      });
      
      if (res.ok) {
        const newTodo = await res.json();
        setTodos([...todos, { ...newTodo, createdAt: new Date().toISOString() }]);
        setTodosInput('');
        setTodosModalOpen(false);
      }
    } catch (error) {
      console.error('Save todo error:', error);
    }
  };

  const saveReminder = async () => {
    if (!remindersInput.trim() || !reminderDateTimeInput) return;
    
    // datetime-local input'u direkt Date objesine çevir
    // Bu zaten local timezone'da çalışır
    const reminderDate = new Date(reminderDateTimeInput);
    const dateTimeISO = reminderDate.toISOString();
    
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: remindersInput.trim(), reminderDateTime: dateTimeISO }),
      });
      
      if (res.ok) {
        const newReminder = await res.json();
        setReminders([...reminders, { 
          ...newReminder, 
          createdAt: new Date().toISOString() 
        }]);
        setRemindersInput('');
        setReminderDateTimeInput('');
        setRemindersModalOpen(false);
        
        // Yeni eklenen hatırlatma için hemen kontrol et (browser yenilemeden popup açılsın)
        setTimeout(() => {
          checkReminders();
        }, 100);
      }
    } catch (error) {
      console.error('Save reminder error:', error);
    }
  };

  const completeReminder = async (id: string) => {
    try {
      const res = await fetch('/api/reminders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: true }),
      });
      
      if (res.ok) {
        setReminders(reminders.map(r => 
          r.id === id ? { ...r, completed: true } : r
        ));
        setActiveReminderPopup(null);
        activeReminderPopupRef.current = null;
      }
    } catch (error) {
      console.error('Complete reminder error:', error);
    }
  };

  // Düzenleme fonksiyonları
  const startEditNote = (note: Note) => {
    setEditingNote(note);
    setEditNoteInput(note.content);
  };

  const saveEditNote = async () => {
    if (!editingNote || !editNoteInput.trim()) return;
    try {
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingNote.id, content: editNoteInput.trim() }),
      });
      
      if (res.ok) {
        setNotes(notes.map(n => 
          n.id === editingNote.id ? { ...n, content: editNoteInput.trim() } : n
        ));
        setEditingNote(null);
        setEditNoteInput('');
      }
    } catch (error) {
      console.error('Edit note error:', error);
    }
  };

  const startEditTodo = (todo: Note) => {
    setEditingTodo(todo);
    setEditTodoInput(todo.content);
  };

  const saveEditTodo = async () => {
    if (!editingTodo || !editTodoInput.trim()) return;
    try {
      const res = await fetch('/api/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingTodo.id, content: editTodoInput.trim() }),
      });
      
      if (res.ok) {
        setTodos(todos.map(t => 
          t.id === editingTodo.id ? { ...t, content: editTodoInput.trim() } : t
        ));
        setEditingTodo(null);
        setEditTodoInput('');
      }
    } catch (error) {
      console.error('Edit todo error:', error);
    }
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

  const saveEditReminder = async () => {
    if (!editingReminder || !editReminderInput.trim() || !editReminderDateTime) return;
    
    const reminderDate = new Date(editReminderDateTime);
    const dateTimeISO = reminderDate.toISOString();
    
    try {
      const res = await fetch('/api/reminders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: editingReminder.id, 
          content: editReminderInput.trim(), 
          reminderDateTime: dateTimeISO 
        }),
      });
      
      if (res.ok) {
        setReminders(reminders.map(r => 
          r.id === editingReminder.id ? { 
            ...r, 
            content: editReminderInput.trim(), 
            reminderDateTime: dateTimeISO 
          } : r
        ));
        setEditingReminder(null);
        setEditReminderInput('');
        setEditReminderDateTime('');
        
        // Hatırlatma zamanı değişti, kontrol et
        setTimeout(() => {
          checkReminders();
        }, 100);
      }
    } catch (error) {
      console.error('Edit reminder error:', error);
    }
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
