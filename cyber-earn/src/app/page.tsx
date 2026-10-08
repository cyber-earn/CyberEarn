'use client';

import React, { useState } from 'react';

export default function Home() {
  const [lang, setLang] = useState<'az' | 'en' | 'es'>('az');

  const translations = {
    az: {
      landing: {
        badge: 'Kibertəhlükəsizliyi öyrən. Təcrübə etdikcə qazan.',
        heroTitle1: 'Real hacking bacarıqlarına yiyələn.',
        heroTitle2: 'Birbaşa brauzerdə.',
        heroDesc: 'Linux, veb təhlükəsizliyi, smart müqavilələr və Python üzrə canlı sandbox tapşırıqlarını həll et — hər həll etdiyin tapşırığa görə real USDT qazan.',
        startBtn: 'Başla',
        loginBtn: 'Daxil ol'
      }
    },
    en: {
      landing: {
        badge: 'Learn cybersecurity. Earn as you practice.',
        heroTitle1: 'Master real hacking skills.',
        heroTitle2: 'Directly in your browser.',
        heroDesc: 'Solve live sandbox tasks in Linux, web security, smart contracts, and Python — earn real USDT for every task you complete.',
        startBtn: 'Get Started',
        loginBtn: 'Log In'
      }
    },
    es: {
      landing: {
        badge: 'Aprende ciberseguridad. Cobra en USDT.',
        heroTitle1: 'Adquiere habilidades reales de hacking.',
        heroTitle2: 'Directamente en el navegador.',
        heroDesc: 'Resuelve tareas de sandbox en vivo sobre Linux, seguridad web, contratos inteligentes y Python: gana USDT real por cada tarea resuelta.',
        startBtn: 'Empezar',
        loginBtn: 'Iniciar sesión'
      }
    }
  };

  const t = translations[lang] || translations.az;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-emerald-400">
            <span>&gt;_</span> CyberEarn
          </div>
          <div className="flex items-center gap-3">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as 'az' | 'en' | 'es')}
              className="bg-slate-800 text-sm text-slate-200 border border-slate-700 rounded-lg px-2 py-1 outline-none"
            >
              <option value="az">🇦🇿 AZ</option>
              <option value="en">🇬🇧 EN</option>
              <option value="es">🇪🇸 ES</option>
            </select>
            <button className="px-4 py-2 text-sm text-slate-300 hover:text-white transition">
              {t.landing.loginBtn}
            </button>
            <button className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-lg transition">
              {t.landing.startBtn}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-block px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm">
            {t.landing.badge}
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            {t.landing.heroTitle1} <br />
            <span className="text-emerald-400">{t.landing.heroTitle2}</span>
          </h1>
          <p className="text-slate-400 text-lg">
            {t.landing.heroDesc}
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <button className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition">
              {t.landing.startBtn}
            </button>
            <button className="px-6 py-3 border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl transition">
              {t.landing.loginBtn}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
