import { useState, useEffect } from 'react'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState('workshops');
  const [darkMode, setDarkMode] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [modalData, setModalData] = useState({ topic: '', date: '' });
  const [data, setData] = useState({ workshops: [], users: [], profile: { institute: '' } });

  useEffect(() => { document.documentElement.classList.toggle('dark', darkMode); }, [darkMode]);

  const refresh = async () => {
    try {
      const [ws, us, pr] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/workshops').then(r => r.json()),
        fetch('http://127.0.0.1:8000/api/users').then(r => r.json()),
        fetch('http://127.0.0.1:8000/api/profile').then(r => r.json()),
      ]);
      setData({ workshops: ws, users: us, profile: pr });
    } catch (e) { console.error("Refresh failed"); }
  };

  useEffect(() => { if (isLoggedIn) refresh(); }, [isLoggedIn]);

  const handleSave = async () => {
    if (!modalData.topic || !modalData.date) return alert("Fill all fields");
    const isEdit = Boolean(editItem);
    const url = isEdit ? `http://127.0.0.1:8000/api/workshops/${editItem.id}` : 'http://127.0.0.1:8000/api/workshops';
    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: modalData.topic.trim(), date: modalData.date }),
    });
    if (res.ok) { setShowModal(false); setEditItem(null); setModalData({topic:'', date:''}); refresh(); }
    else alert("Error saving to database.");
  };

  if (!isLoggedIn) return (
    <div className="h-screen bg-slate-950 flex items-center justify-center p-4">
      <button onClick={() => setIsLoggedIn(true)} className="bg-blue-600 text-white w-full max-w-xs py-5 rounded-[2rem] font-black shadow-2xl active:scale-95 transition-all text-xl">Enter Portal</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-300 flex flex-col md:flex-row p-3 md:p-6 gap-4 transition-colors font-sans">
      
      {/* SIDEBAR / MOBILE NAV */}
      <aside className="w-full md:w-80 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-6 md:p-8 flex flex-col gap-2 shrink-0 shadow-lg">
        <div className="flex justify-between items-center mb-6 md:mb-10">
            <div className="font-black dark:text-white text-xl italic tracking-tighter truncate">FOSSEE <span className="text-blue-600 text-2xl">Master</span></div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-3 bg-slate-100 dark:bg-white/10 rounded-2xl active:scale-90 transition-all">{darkMode ? '☀️' : '🌙'}</button>
        </div>
        <div className="flex md:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          {['workshops', 'users', 'profile'].map(sec => (
            <button key={sec} onClick={() => setView(sec)} className={`flex-1 md:flex-none whitespace-nowrap px-6 py-4 rounded-2xl text-left font-bold capitalize transition-all ${view === sec ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10'}`}>{sec}</button>
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-2 md:p-12 pb-24">
        <header className="flex flex-row justify-between items-center mb-10 md:mb-16">
          <h2 className="text-4xl md:text-8xl font-black dark:text-white tracking-tighter capitalize">{view}</h2>
          {view === 'workshops' && <button onClick={() => { setEditItem(null); setModalData({topic:'', date:''}); setShowModal(true); }} className="bg-blue-600 text-white px-6 md:px-10 py-3 md:py-5 rounded-2xl font-black shadow-xl active:scale-95 transition-all text-sm">+ NEW</button>}
        </header>

        {/* LISTS */}
        <div className="grid grid-cols-1 gap-4">
          {view === 'workshops' && data.workshops.map(w => (
            <div key={w.id} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[2.5rem] p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-sm gap-4 transition-all hover:border-blue-500/50">
                <div className="max-w-[70%]">
                  <h3 className="text-xl md:text-2xl font-black dark:text-white break-words">{w.title}</h3>
                  <p className="text-slate-500 font-medium text-sm md:text-base">📅 {w.date}</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => { setEditItem(w); setModalData({topic: w.title, date: w.date}); setShowModal(true); }} className="flex-1 sm:flex-none px-5 py-3 bg-blue-600/10 text-blue-500 rounded-2xl font-black text-[10px] uppercase tracking-widest active:bg-blue-600 active:text-white transition-all">EDIT</button>
                  <button onClick={async () => { if(confirm("Delete workshop?")) { await fetch(`http://127.0.0.1:8000/api/workshops/${w.id}`, {method:'DELETE'}); refresh(); } }} className="flex-1 sm:flex-none px-5 py-3 bg-rose-600/10 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest active:bg-rose-600 active:text-white transition-all">DELETE</button>
                </div>
            </div>
          ))}

          {view === 'users' && data.users.map(u => (
            <div key={u.id} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[2rem] p-6 flex justify-between items-center shadow-sm">
                <span className="font-bold dark:text-white text-lg truncate pr-4">{u.username}</span>
                <button onClick={async () => { const p = prompt("New Pass:"); if(p) { await fetch(`http://127.0.0.1:8000/api/users/${u.id}/reset`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({new_password:p})}); alert("Pass changed!"); } }} className="whitespace-nowrap px-4 py-2 bg-blue-600/10 text-blue-600 rounded-xl font-black text-[10px] uppercase">Reset</button>
            </div>
          ))}

          {view === 'profile' && (
            <div className="max-w-xl mx-auto md:mx-0 bg-white dark:bg-white/5 p-8 md:p-12 rounded-[3.5rem] border border-slate-100 dark:border-white/10 shadow-2xl">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-4 block tracking-widest text-center">Institute Identity</label>
                <input className="w-full p-5 bg-slate-50 dark:bg-white/5 rounded-3xl mb-8 dark:text-white outline-none border-2 border-transparent focus:border-blue-500 font-black text-xl text-center" value={data.profile.institute} onChange={e => setData({...data, profile: {institute: e.target.value}})} />
                <button onClick={async () => { await fetch('http://127.0.0.1:8000/api/profile/update', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({institute: data.profile.institute})}); alert("Profile Updated!"); }} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black shadow-xl active:scale-95 transition-all">Update Database</button>
            </div>
          )}
        </div>
      </main>

      {/* MODAL (Responsive Width) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3.5rem] w-full max-w-[450px] shadow-2xl animate-in zoom-in duration-200 border border-white/5">
            <h2 className="text-2xl md:text-3xl font-black mb-8 dark:text-white text-center">{editItem ? 'Edit' : 'New'} Workshop</h2>
            <div className="space-y-4 mb-8">
                <input value={modalData.topic} onChange={e => setModalData({...modalData, topic: e.target.value})} placeholder="Topic Name" className="w-full p-5 bg-slate-100 dark:bg-white/5 rounded-2xl dark:text-white outline-none focus:border-blue-500 border-2 border-transparent transition-all" />
                <input type="date" value={modalData.date} onChange={e => setModalData({...modalData, date: e.target.value})} className="w-full p-5 bg-slate-100 dark:bg-white/5 rounded-2xl dark:text-white outline-none" />
            </div>
            <div className="flex flex-col gap-4">
              <button onClick={handleSave} className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl active:scale-95 transition-all">Confirm & Save</button>
              <button onClick={() => { setShowModal(false); setEditItem(null); }} className="text-slate-400 font-bold text-xs uppercase text-center tracking-[0.2em] py-2">Go Back</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}