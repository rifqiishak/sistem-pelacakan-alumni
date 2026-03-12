'use client';

import React, { useState } from 'react';
import { UserPlus, ListTodo, HelpCircle, Save, Info, AlertTriangle, CheckCircle, Sparkles, BookOpen, GraduationCap, Briefcase, MapPin, Calendar } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect } from 'react';

const Portal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
};

export default function KonfigurasiPage() {
  const [formData, setFormData] = useState({ namaLengkap: '', kampus: '', prodi: '', tahunLulus: '', kotaAsal: '' });
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<{id: number, message: string, type: string}[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaLengkap || !formData.kampus || !formData.prodi) {
      showToast("Isi field wajib: Nama, Kampus, dan Prodi.", "warning");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/alumni', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (data.sukses) {
        showToast("Target berhasil ditambahkan ke database!");
        setFormData({ namaLengkap: '', kampus: '', prodi: '', tahunLulus: '', kotaAsal: '' });
      } else showToast("Gagal: " + data.error, "error");
    } catch(e: any) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      {/* Toasts */}
      <Portal>
        <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none w-[calc(100%-2rem)] sm:w-auto max-w-sm">
          {toasts.map(toast => (
            <div key={toast.id} className={`pointer-events-auto p-3.5 rounded-xl shadow-2xl font-semibold text-sm text-white flex items-start gap-2.5 border transition-all ${toast.type === 'error' ? 'bg-red-500/90 border-red-400/30' : toast.type === 'warning' ? 'bg-amber-500/90 border-amber-400/30' : 'bg-emerald-500/90 border-emerald-400/30'}`}>
               {toast.type === 'error' ? <AlertTriangle size={16} className="shrink-0 mt-0.5"/> : toast.type === 'warning' ? <AlertTriangle size={16} className="shrink-0 mt-0.5"/> : <CheckCircle size={16} className="shrink-0 mt-0.5"/>}
               <div className="leading-snug">{toast.message}</div>
            </div>
          ))}
        </div>
      </Portal>

      {/* PAGE HEADER */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/30 pointer-events-none"></div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight relative z-10">Konfigurasi Target</h2>
        <p className="text-slate-500 mt-1 text-sm relative z-10">Tambahkan profil alumni yang akan dicari rekam jejaknya secara otomatis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
        {/* Form Column */}
        <div className="md:col-span-7 bg-white border border-slate-200/80 p-6 sm:p-8 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-600/20">
               <UserPlus size={20} className="stroke-[2.5]" />
             </div>
             <h3 className="text-lg font-bold text-slate-800">Identitas Target</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><GraduationCap size={13}/> Nama Lengkap <span className="text-red-500">*</span></label>
              <input value={formData.namaLengkap} onChange={e => setFormData({...formData, namaLengkap: e.target.value})} type="text" className="w-full bg-white text-slate-800 border border-slate-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all placeholder-slate-400" placeholder="Cth: Muhammad Rifqi Maulana" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><BookOpen size={13}/> Universitas <span className="text-red-500">*</span></label>
                <input value={formData.kampus} onChange={e => setFormData({...formData, kampus: e.target.value})} type="text" className="w-full bg-white text-slate-800 border border-slate-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all placeholder-slate-400" placeholder="Cth: UMM" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Briefcase size={13}/> Program Studi <span className="text-red-500">*</span></label>
                <input value={formData.prodi} onChange={e => setFormData({...formData, prodi: e.target.value})} type="text" className="w-full bg-white text-slate-800 border border-slate-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all placeholder-slate-400" placeholder="Cth: Informatika" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Calendar size={13}/> Tahun Lulus</label>
                <input value={formData.tahunLulus} onChange={e => setFormData({...formData, tahunLulus: e.target.value})} type="text" className="w-full bg-white text-slate-800 border border-slate-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all placeholder-slate-400" placeholder="Cth: 2023" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><MapPin size={13}/> Kata Kunci Tambahan</label>
                <input value={formData.kotaAsal} onChange={e => setFormData({...formData, kotaAsal: e.target.value})} type="text" className="w-full bg-white text-slate-800 border border-slate-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all placeholder-slate-400" placeholder="Cth: Backend Developer" />
              </div>
            </div>

            <button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white p-3.5 rounded-xl font-semibold flex justify-center items-center gap-2 mt-4 transition-all active:scale-[0.98] shadow-sm text-sm">
              <Save size={16} className={loading ? "animate-pulse" : ""} /> 
              {loading ? "Memproses..." : "Simpan Target"}
            </button>
          </form>
        </div>

        {/* Info Column */}
        <div className="md:col-span-5 flex flex-col gap-4 sm:gap-5 pb-20 sm:pb-0">
          <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-2xl shadow-sm">
            <h3 className="text-base font-bold mb-5 flex items-center gap-2.5 text-slate-800">
               <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><ListTodo size={16} /></div>
               Regulasi Skoring
            </h3>
            
            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
              {[
                {n:'1', text:<>Mesin memprioritaskan ekstraksi lewat <strong className="text-slate-800">LinkedIn, SINTA, dan Github</strong>.</>},
                {n:'2', text:<>Kecocokan Nama Penuh = <strong className="text-blue-600">+60 Poin</strong>. Universitas identik = <strong className="text-blue-600">+40 Poin</strong>.</>},
                {n:'3', text:<>Threshold: <strong className="text-emerald-600">Kuat (≥ 80)</strong>, <strong className="text-amber-600">Review (≥ 50)</strong>.</>},
                {n:'4', text:<>Teknik <strong className="text-slate-800">Rotasi Paginasi</strong> murni HTTP berkinerja tinggi.</>},
              ].map(item => (
                <div key={item.n} className="flex gap-3 items-start group">
                  <span className="bg-slate-100 text-slate-500 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-semibold text-xs border border-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">{item.n}</span>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
             <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm">
               <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><HelpCircle size={14}/></div>
               Kapan Menggunakan Tahun?
             </h4>
             <p className="text-sm text-slate-500 leading-relaxed">Pengisian tahun krusial jika alumni memiliki <strong className="text-slate-800">nama pasaran</strong> ("Agus", "Budi"). Sistem akan memindai berita wisuda spesifik tahun tersebut.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
