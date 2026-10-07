'use client';

import { useCallback, useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { fetchBalance, getOrCreateProfile, type Profile } from '@/lib/supabaseClient';

type State =
  | { status: 'loading' }
  | { status: 'no-telegram' }
  | { status: 'error'; message: string }
  | { status: 'ready'; profile: Profile };

const formatLxr = (value: number) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

export default function Dashboard() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        WebApp.ready();
        WebApp.expand();

        const user = WebApp.initDataUnsafe?.user;
        if (!user) {
          if (!cancelled) setState({ status: 'no-telegram' });
          return;
        }

        const profile = await getOrCreateProfile(user.id, user.username ?? null);
        if (!cancelled) setState({ status: 'ready', profile });
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : 'Naməlum xəta baş verdi.',
          });
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (state.status !== 'ready') return;
    setRefreshing(true);
    try {
      const balance = await fetchBalance(state.profile.telegram_id);
      setState({ status: 'ready', profile: { ...state.profile, lxr_balance: balance } });
      WebApp.HapticFeedback?.notificationOccurred('success');
    } catch (err) {
      console.error(err);
      WebApp.HapticFeedback?.notificationOccurred('error');
    } finally {
      setRefreshing(false);
    }
  }, [state]);

  return (
    <main className="min-h-screen bg-[#0a0e1a] px-5 pb-10 pt-8 text-slate-100">
      <div className="mx-auto w-full max-w-md">
        {state.status === 'loading' && <Skeleton />}

        {state.status === 'no-telegram' && (
          <Notice
            title="Telegram-dan açın"
            text="Bu tətbiq yalnız Telegram daxilində işləyir. Botumuz vasitəsilə Mini App-ı açın."
          />
        )}

        {state.status === 'error' && (
          <Notice
            title="Məlumatlar yüklənmədi"
            text={state.message}
            action={{ label: 'Yenidən cəhd et', onClick: () => window.location.reload() }}
          />
        )}

        {state.status === 'ready' && (
          <Content profile={state.profile} refreshing={refreshing} onRefresh={refresh} />
        )}
      </div>
    </main>
  );
}

function Content({
  profile,
  refreshing,
  onRefresh,
}: {
  profile: Profile;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const displayName = profile.username ? `@${profile.username}` : `ID ${profile.telegram_id}`;
  const initial = (profile.username ?? 'U').charAt(0).toUpperCase();

  return (
    <>
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#162036] text-lg font-semibold text-[#5eead4] ring-1 ring-[#5eead4]/30">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-medium">{displayName}</p>
          <p className="text-sm text-slate-400">Cyber Earn hesabınız</p>
        </div>
      </header>

      <section
        aria-labelledby="balance-title"
        className="mt-8 rounded-3xl border border-white/5 bg-gradient-to-b from-[#121a2e] to-[#0d1424] p-6"
      >
        <h2 id="balance-title" className="text-sm text-slate-400">
          LXR balansı
        </h2>

        <p className="mt-3 flex items-baseline gap-2">
          <span className="text-5xl font-semibold tabular-nums tracking-tight text-white">
            {formatLxr(profile.lxr_balance)}
          </span>
          <span className="text-lg font-medium text-[#5eead4]">LXR</span>
        </p>

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="mt-6 w-full rounded-2xl bg-[#5eead4] py-3 text-sm font-semibold text-[#06201c] transition active:scale-[0.98] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5eead4]"
        >
          {refreshing ? 'Yenilənir…' : 'Balansı yenilə'}
        </button>
      </section>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-[#0f1627] p-4">
          <dt className="text-slate-400">Telegram ID</dt>
          <dd className="mt-1 font-medium tabular-nums">{profile.telegram_id}</dd>
        </div>
        <div className="rounded-2xl bg-[#0f1627] p-4">
          <dt className="text-slate-400">Qoşulma tarixi</dt>
          <dd className="mt-1 font-medium">
            {new Date(profile.created_at).toLocaleDateString('az-AZ')}
          </dd>
        </div>
      </dl>
    </>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Yüklənir">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-[#162036]" />
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-[#162036]" />
          <div className="h-3 w-24 rounded bg-[#162036]" />
        </div>
      </div>
      <div className="mt-8 h-48 rounded-3xl bg-[#121a2e]" />
    </div>
  );
}

function Notice({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div role="alert" className="mt-16 rounded-3xl border border-white/5 bg-[#121a2e] p-6 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-5 rounded-2xl bg-[#5eead4] px-5 py-2.5 text-sm font-semibold text-[#06201c]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}