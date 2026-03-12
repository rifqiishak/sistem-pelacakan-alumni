'use client';

import React from 'react';
import './globals.css';
import { LayoutDashboard, Settings2, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-800 antialiased font-sans flex flex-col min-h-screen selection:bg-blue-100 selection:text-blue-900">

        {/* DESKTOP HEADER */}
        <div className="hidden md:flex justify-center pt-5 px-6 relative z-50">
           <header className="w-full max-w-5xl h-14 bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm rounded-2xl flex justify-between items-center px-2 transition-all">
             
             <div className="flex items-center gap-2.5 pl-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex justify-center items-center text-white shadow-sm">
                  <Sparkles size={16} className="stroke-[2.5]" />
                </div>
                <h1 className="text-sm font-bold tracking-tight text-slate-800">
                   Alumni<span className="text-blue-600 font-extrabold">Pro</span>
                </h1>
             </div>
             
             <nav className="flex items-center gap-1 pr-1">
                <a href="/" className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${pathname === '/' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}>
                   <LayoutDashboard size={14} /> Dashboard
                </a>
                <a href="/konfigurasi" className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${pathname === '/konfigurasi' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}>
                   <Settings2 size={14} /> Konfigurasi
                </a>
             </nav>
           </header>
        </div>

        {/* MOBILE HEADER */}
        <header className="md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 h-14 flex items-center px-4">
           <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex justify-center items-center text-white">
                <Sparkles size={14} className="stroke-[2.5]" />
              </div>
              <h1 className="text-sm font-bold tracking-tight text-slate-800">
                 Alumni<span className="text-blue-600 font-extrabold">Pro</span>
              </h1>
           </div>
        </header>
        
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-10 relative z-10">
          {children}
        </main>
        
        {/* MOBILE BOTTOM NAV */}
        <div className="md:hidden fixed bottom-0 inset-x-0 z-50">
           <nav className="flex items-center bg-white/90 backdrop-blur-xl border-t border-slate-200/60 px-6 py-2">
              <a href="/" className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${pathname === '/' ? 'text-blue-600' : 'text-slate-400'}`}>
                 <LayoutDashboard size={20} />
                 <span className="text-[10px] font-semibold mt-0.5">Dashboard</span>
              </a>
              <a href="/konfigurasi" className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${pathname === '/konfigurasi' ? 'text-blue-600' : 'text-slate-400'}`}>
                 <Settings2 size={20} />
                 <span className="text-[10px] font-semibold mt-0.5">Konfigurasi</span>
              </a>
           </nav>
        </div>

      </body>
    </html>
  );
}
