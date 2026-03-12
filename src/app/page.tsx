'use client';

import React, { useEffect, useState } from 'react';
import { Search, History, Users, Activity, CheckCircle, Clock, Trash2, Eye, ClipboardCheck, Info, AlertTriangle, ShieldCheck, Save, Sparkles, Server } from 'lucide-react';
import { createPortal } from 'react-dom';

const Portal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
};

export default function DashboardPage() {
  const formatRealTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const safeStr = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
      const d = new Date(safeStr);
      const diff = Math.floor((Date.now() - d.getTime()) / 1000);
      if (diff < 60) return 'Baru saja';
      if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
      return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB';
    } catch(e) {
      return dateStr;
    }
  };

  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, ditemukan: 0, verifikasi: 0, belumDilacak: 0 });
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);

  // Modern UI Control States
  const [toasts, setToasts] = useState<{id: number, message: string, type: string}[]>([]);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({isOpen: false, message: '', onConfirm: () => {}});
  const [activeAlumniId, setActiveAlumniId] = useState<number | null>(null);
  const [activeAlumniName, setActiveAlumniName] = useState<string>('');
  
  // Verify Modal States
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyLogs, setVerifyLogs] = useState<any[]>([]);
  const [verifyChecked, setVerifyChecked] = useState<number[]>([]);
  
  // Detail Modal States
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLogs, setDetailLogs] = useState<any[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, message, onConfirm });
  };

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/alumni');
      const json = await res.json();
      if (json.sukses) {
        setData(json.data);
        setStats({
          total: json.stats.total,
          ditemukan: json.stats.ditemukan,
          verifikasi: json.stats.verifikasi,
          belumDilacak: json.stats.belumDilacak
        });
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const runScheduler = async () => {
    setTracking(true);
    try {
      const res = await fetch('/api/track', { method: 'POST' });
      const json = await res.json();
      if (json.sukses) {
        showToast("Berhasil! Mesin pelacak telah selesai mengukur skor.");
      } else {
        showToast("Gagal menjalankan! Error koneksi bot: " + json.error, "error");
      }
      fetchDashboard();
    } catch(e) {
      showToast(String(e), 'error');
    } finally {
      setTracking(false);
    }
  };

  const hapusAlumni = (id: number, nama: string) => {
    showConfirm(`Data alumni "${nama}" akan dihapus permanen beserta riwayat jejaknya. Lanjutkan?`, async () => {
      try {
        const res = await fetch(`/api/alumni/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            showToast("Profil berhasil dihapus!");
            fetchDashboard();
        } else {
            showToast("Gagal: " + result.error, "error");
        }
      } catch (err) {
        showToast("Kesalahan koneksi.", "error");
      }
    });
  };

  const openVerifyModal = async (id: number, nama: string) => {
    setActiveAlumniId(id);
    setActiveAlumniName(nama);
    setVerifyLogs([]);
    setVerifyChecked([]);
    setVerifyModalOpen(true);
    try {
      const res = await fetch(`/api/alumni/${id}/logs`);
      const logs = await res.json();
      setVerifyLogs(logs || []);
    } catch(e: any) {
      showToast('Gagal memuat jejak', 'error');
    }
  };

  const aksiVerifikasi = async (statusBaru: string) => {
    if (!activeAlumniId) return;
    if (statusBaru === 'Teridentifikasi' && verifyChecked.length === 0) {
        showToast("Pilih setidaknya satu bukti rekaman!", "warning");
        return;
    }
    try {
        const res = await fetch(`/api/alumni/${activeAlumniId}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status_baru: statusBaru, validLogIds: verifyChecked })
        });
        const data = await res.json();
        if (data.success) {
            setVerifyModalOpen(false);
            fetchDashboard();
            showToast("Verifikasi manual tersimpan.");
        } else {
            showToast(data.error, "error");
        }
    } catch (err: any) {
        showToast("Gagal mengubah status.", "error");
    }
  }

  const openDetailModal = async (id: number, nama: string) => {
    setActiveAlumniId(id);
    setActiveAlumniName(nama);
    setDetailLogs([]);
    setDetailModalOpen(true);
    await muatLogDetail(id);
  };

  const muatLogDetail = async (id: number) => {
    try {
      const res = await fetch(`/api/alumni/${id}/logs`);
      const logs = await res.json();
      setDetailLogs(logs || []);
    } catch(e: any) {
      showToast('Error: ' + e.message, 'error');
    }
  };

  const hapusLog = async (logId: number) => {
    showConfirm('Hapus satu rekam jejak ini?', async () => {
        try {
            const res = await fetch(`/api/logs/${logId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                if (activeAlumniId) await muatLogDetail(activeAlumniId);
                showToast("Rekam jejak dihapus.");
            } else {
                showToast('Gagal: ' + data.error, "error");
            }
        } catch (e: any) {
            showToast('Error: ' + e.message, "error");
        }
    });
  }

  const renderStatusBadge = (status: string) => {
     if (status === 'Teridentifikasi dari sumber publik') {
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold"><ShieldCheck size={13}/> Verified</span>;
     } else if (status === 'Perlu Verifikasi Manual') {
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold"><AlertTriangle size={13}/> Review</span>;
     } else if (status === 'Belum ditemukan di sumber publik') {
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg text-xs font-semibold"><Info size={13}/> Null</span>;
     }
     return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-400 border border-slate-200 rounded-lg text-[10px] font-semibold uppercase tracking-wider">Antre</span>;
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      
      <Portal>
        <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none w-[calc(100%-2rem)] sm:w-auto max-w-sm">
          {toasts.map(toast => (
            <div key={toast.id} className={`pointer-events-auto p-3.5 rounded-xl shadow-2xl font-semibold text-sm text-white flex items-start gap-2.5 border transition-all ${toast.type === 'error' ? 'bg-red-500/90 border-red-400/30' : toast.type === 'warning' ? 'bg-amber-500/90 border-amber-400/30' : 'bg-emerald-500/90 border-emerald-400/30'}`}>
               {toast.type === 'error' ? <Info size={16} className="shrink-0 mt-0.5"/> : toast.type === 'warning' ? <AlertTriangle size={16} className="shrink-0 mt-0.5"/> : <CheckCircle size={16} className="shrink-0 mt-0.5"/>}
               <div className="leading-snug">{toast.message}</div>
            </div>
          ))}
        </div>
      </Portal>

      {/* HERO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-slate-200/80 p-6 sm:p-8 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/30 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-600/20 shrink-0">
             <Activity size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Intelligence Hub</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Sistem Pelacak Rekam Jejak Profil Otomatis</p>
          </div>
        </div>
        <button onClick={runScheduler} disabled={tracking} className="relative z-10 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all active:scale-[0.97] shadow-sm w-full md:w-auto justify-center">
           {tracking ? <Search size={16} className="animate-spin" /> : <Sparkles size={16} />}
           {tracking ? "Memproses..." : "Mulai Pelacakan"}
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[{label:'Total Target',val:stats.total,icon:<Users size={18}/>,color:'text-blue-600 bg-blue-50'},{label:'Terverifikasi',val:stats.ditemukan,icon:<ShieldCheck size={18}/>,color:'text-emerald-600 bg-emerald-50'},{label:'Review',val:stats.verifikasi,icon:<AlertTriangle size={18}/>,color:'text-amber-600 bg-amber-50'},{label:'Menunggu',val:stats.belumDilacak,icon:<Clock size={18}/>,color:'text-slate-500 bg-slate-100'}].map((s,i)=>(
          <div key={i} className="bg-white border border-slate-200/80 p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all group">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${s.color}`}>{s.icon}</div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
            <h3 className="text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight">{s.val}</h3>
          </div>
        ))}
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm sm:text-base font-semibold text-slate-700 flex items-center gap-2">
             <History size={16} className="text-blue-600"/> Database Profil
          </h3>
        </div>
        
        {loading ? (
             <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Activity className="animate-spin text-blue-500" size={32} />
                <span className="font-semibold text-sm">Memuat data...</span>
             </div>
        ) : data.length === 0 ? (
             <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-50/30">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-2"><Users size={32} /></div>
                <span className="font-semibold text-slate-500">Belum ada target di database.</span>
                <span className="text-xs">Navigasi ke menu "Konfigurasi" untuk mendaftarkan alumni.</span>
             </div>
        ) : (
          <>
            {/* TAMPILAN MOBILE: KUMPULAN CARD (Hanya muncul di hp) */}
             <div className="md:hidden flex flex-col divide-y divide-slate-100">
               {data.map(item => (
                 <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                       <div>
                          <h4 className="font-semibold text-slate-800 text-sm">{item.namaLengkap}</h4>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                             <Clock size={10} /> {item.lastUpdateSearch ? formatRealTime(item.lastUpdateSearch) : 'Menunggu'}
                          </div>
                       </div>
                       <div>{renderStatusBadge(item.status)}</div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                       <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">{item.kampus}</span>
                       <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-medium">Lulusan {item.tahunLulus || '?'}</span>
                    </div>

                    <div className="bg-slate-50 text-xs text-slate-600 p-3 rounded-lg mb-3 leading-relaxed border border-slate-100">
                       {item.ringkasanAktivitas ? (item.ringkasanAktivitas.length > 90 ? item.ringkasanAktivitas.substring(0, 90) + '...' : item.ringkasanAktivitas) : <span className="text-slate-400 italic">Belum ada aktivitas terekam.</span>}
                    </div>
                    <div className="flex items-center gap-2 w-full">
                       {item.status === 'Perlu Verifikasi Manual' ? (
                          <button onClick={() => openVerifyModal(item.id, item.namaLengkap)} className="flex-1 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-semibold flex justify-center items-center gap-1.5"><ClipboardCheck size={14}/> REVIEW</button>
                       ) : item.status === 'Teridentifikasi dari sumber publik' ? (
                          <button onClick={() => openDetailModal(item.id, item.namaLengkap)} className="flex-1 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-semibold flex justify-center items-center gap-1.5"><Eye size={14}/> SUMBER</button>
                       ) : (
                          <div className="flex-1"></div>
                       )}
                       <button onClick={() => hapusAlumni(item.id, item.namaLengkap)} className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 border border-slate-200 rounded-lg transition-colors"><Trash2 size={14}/></button>
                    </div>
                 </div>
               ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 border-collapse">
                <thead className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 w-1/4">Profil</th>
                    <th className="px-6 py-4">Hasil Ekstraksi</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group/row">
                      <td className="px-6 py-5 align-top">
                        <span className="block font-semibold text-slate-800 text-sm">{item.namaLengkap}</span>
                        <span className="block text-blue-600 text-xs mt-0.5">{item.kampus}</span>
                        <div className="flex items-center gap-2 mt-1.5">
                           <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">{item.prodi}</span>
                           <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock size={10} /> {item.lastUpdateSearch ? formatRealTime(item.lastUpdateSearch) : 'Menunggu'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-xs align-top">
                         {item.ringkasanAktivitas ? (
                             <div className="bg-slate-50 p-3 rounded-lg text-slate-600 leading-relaxed max-w-md border border-slate-100">{item.ringkasanAktivitas.length > 110 ? item.ringkasanAktivitas.substring(0, 110) + '...' : item.ringkasanAktivitas}</div>
                         ) : (
                             <span className="text-slate-400 italic text-[11px]"><Search size={12} className="inline mr-1"/>Menunggu crawler...</span>
                         )}
                      </td>
                      <td className="px-6 py-5 text-center align-middle">{renderStatusBadge(item.status)}</td>
                      <td className="px-6 py-5 text-right align-middle">
                         <div className="flex items-center justify-end gap-1.5 opacity-40 group-hover/row:opacity-100 transition-opacity">
                            {item.status === 'Teridentifikasi dari sumber publik' && (
                               <button onClick={() => openDetailModal(item.id, item.namaLengkap)} className="px-2.5 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"><Eye size={13}/> Sumber</button>
                            )}
                            {item.status === 'Perlu Verifikasi Manual' && (
                               <button onClick={() => openVerifyModal(item.id, item.namaLengkap)} className="px-2.5 py-1.5 text-amber-600 hover:bg-amber-50 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"><ClipboardCheck size={13}/> Review</button>
                            )}
                            <button onClick={() => hapusAlumni(item.id, item.namaLengkap)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14}/></button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* MODAL VERIFY (Mobile Optimized) */}
      {verifyModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4">
             <div className="bg-white border border-slate-200 sm:rounded-2xl rounded-t-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
             <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center">
               <div>
                 <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><ClipboardCheck className="text-amber-600" size={20}/> Verifikasi Manual</h2>
                 <p className="text-xs text-slate-500 mt-0.5">TARGET: <span className="text-blue-600">{activeAlumniName}</span></p>
               </div>
               <button onClick={() => setVerifyModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-400 rounded-lg hover:text-slate-700">&times;</button>
             </div>
             <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs sm:text-sm mb-5 flex items-start gap-3">
                   <AlertTriangle size={20} className="shrink-0 text-amber-500" />
                   <p>Centang <strong>bukti tautan yang akurat</strong> di bawah ini.</p>
                </div>
                
                {verifyLogs.length === 0 ? (
                  <p className="text-center text-slate-400 font-semibold py-8 border border-dashed border-slate-300 rounded-xl text-sm">Tidak ada rekam jejak.</p>
                ) : (
                  <div className="space-y-2">
                    {verifyLogs.map((l: any) => (
                      <div key={l.id} className={`bg-white border text-sm p-3 sm:p-4 rounded-xl flex items-start gap-3 cursor-pointer transition-all shadow-sm ${verifyChecked.includes(l.id) ? 'border-blue-500 bg-blue-50/30 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'}`} onClick={() => {
                          if (verifyChecked.includes(l.id)) setVerifyChecked(verifyChecked.filter(v => v !== l.id));
                          else setVerifyChecked([...verifyChecked, l.id]);
                      }}>
                         <div className="mt-1 relative flex items-center justify-center shrink-0">
                            <input type="checkbox" className="w-5 h-5 cursor-pointer appearance-none border-2 border-slate-300 rounded-lg checked:bg-blue-600 checked:border-blue-600 transition-colors" checked={verifyChecked.includes(l.id)} readOnly />
                            {verifyChecked.includes(l.id) && <CheckCircle size={14} className="text-white absolute pointer-events-none" />}
                         </div>
                         <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                               <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${l.confidence_score >= 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>Score: {l.confidence_score}%</span>
                               <span className="text-[10px] text-slate-400">{formatRealTime(l.waktu_pelacakan)}</span>
                            </div>
                            <div className="text-slate-700 text-sm leading-snug mb-2">{l.keterangan}</div>
                            <div className="text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100 break-all flex items-center gap-1.5"><Search size={11} className="text-blue-500 shrink-0"/> <a href={l.tautan_bukti} target="_blank" className="text-blue-600 hover:underline truncate" onClick={e => e.stopPropagation()}>{l.sumber}</a></div>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
             <div className="p-4 border-t border-slate-100 flex justify-end gap-2 flex-col sm:flex-row">
               <button onClick={() => setVerifyModalOpen(false)} className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-semibold text-sm order-2 sm:order-1 hover:bg-slate-200">Batal</button>
               <button onClick={() => aksiVerifikasi('Teridentifikasi')} className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 order-1 sm:order-2">
                 <Save size={16} /> Simpan Valid
               </button>
             </div>
          </div>
        </div>
        </Portal>
      )}

      {/* MODAL DETAIL (Mobile Optimized) */}
      {detailModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4">
             <div className="bg-white border border-slate-200 sm:rounded-2xl rounded-t-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
             <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center">
               <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Eye className="text-blue-600" size={20}/> Riwayat Tautan</h2>
                  <p className="text-xs text-slate-500 mt-0.5">SUMBER: <span className="text-blue-600">{activeAlumniName}</span></p>
               </div>
               <button onClick={() => setDetailModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-400 rounded-lg hover:text-slate-700">&times;</button>
             </div>
             <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50">
                {detailLogs.length === 0 ? (
                  <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-400 font-semibold flex flex-col items-center gap-2">
                     <AlertTriangle size={24} className="text-slate-400" />
                     Data historis telah dibersihkan.
                  </div>
                ) : (
                  <div className="space-y-3 relative">
                    <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-slate-200 z-0"></div>
                    {detailLogs.map((l: any) => (
                      <div key={l.id} className="relative z-10 flex gap-3 items-start pl-1">
                         <div className="w-5 h-5 rounded-full bg-white border-2 border-blue-400 shrink-0 mt-1 shadow-sm"></div>
                         <div className="flex-1 bg-white border border-slate-200 p-4 rounded-xl hover:border-slate-300 transition-colors shadow-sm group/log min-w-0">
                            <div className="flex justify-between items-start mb-2">
                               <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${l.confidence_score >= 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{l.confidence_score >= 80 ? 'KUAT' : 'LEMAH'} ({l.confidence_score}%)</span>
                                  <span className="text-[10px] text-slate-400"><Clock size={10} className="inline mr-1" />{formatRealTime(l.waktu_pelacakan)}</span>
                               </div>
                               <button onClick={() => hapusLog(l.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors shrink-0"><Trash2 size={14}/></button>
                            </div>
                            <div className="text-slate-700 text-sm leading-relaxed mb-2">{l.keterangan}</div>
                            <div className="text-[11px] flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div> <a href={l.tautan_bukti} target="_blank" className="text-blue-600 hover:underline truncate"><Search size={11} className="inline mr-1 shrink-0"/>{l.sumber}</a></div>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
             <div className="p-4 border-t border-slate-100 flex justify-end">
               <button onClick={() => setDetailModalOpen(false)} className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm">Tutup</button>
             </div>
          </div>
        </div>
        </Portal>
      )}

      {/* CONFIRM MODAL OVERLAY */}
      {confirmModal.isOpen && (
        <Portal>
          <div className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-md p-4">
             <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-2xl w-full sm:max-w-sm">
                <div className="text-center">
                   <div className="w-14 h-14 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mx-auto mb-4"><Trash2 size={22} /></div>
                   <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Item?</h3>
                   <p className="text-slate-500 text-sm mb-6 leading-relaxed">{confirmModal.message}</p>
                   <div className="flex flex-col sm:flex-row justify-center gap-2">
                      <button onClick={() => setConfirmModal({isOpen: false, message: '', onConfirm: () => {}})} className="px-5 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-xl w-full hover:bg-slate-200 text-sm">Batal</button>
                      <button onClick={() => { confirmModal.onConfirm(); setConfirmModal({isOpen: false, message: '', onConfirm: () => {}}); }} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl w-full text-sm">Ya, Hapus</button>
                   </div>
                </div>
             </div>
          </div>
        </Portal>
      )}

    </div>
  );
}
