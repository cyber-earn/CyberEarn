
'use client';

import Dashboard from '@/components/Dashboard';
import Tasks from '@/components/Tasks';
import Withdraw from '@/components/Withdraw';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 text-white p-4 max-w-md mx-auto space-y-6 pb-20">
      <header className="text-center py-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-cyan-400">Cyber Earn</h1>
        <p className="text-xs text-slate-400">Complete tasks, earn LXR</p>
      </header>

      {/* User Dashboard & Balance */}
      <Dashboard />

      {/* Tasks List */}
      <Tasks />

      {/* Withdraw Section */}
      <Withdraw />
    </main>
  );
}