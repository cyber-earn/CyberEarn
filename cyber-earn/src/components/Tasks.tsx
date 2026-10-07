'use client';

import { useCallback, useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { getOrCreateProfile } from '@/lib/supabaseClient';
import {
  claimTask,
  ClaimError,
  fetchActiveTasks,
  fetchCompletedTaskIds,
  type Task,
} from '@/lib/tasksApi';

/** Linkə kliklədikdən neçə saniyə sonra Claim aktiv olsun */
const CLAIM_DELAY_SEC = 5;

type LoadState =
  | { status: 'loading' }
  | { status: 'no-telegram' }
  | { status: 'error'; message: string }
  | { status: 'ready' };

const formatLxr = (v: number) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

function openTaskLink(url: string) {
  if (/^https?:\/\/(t\.me|telegram\.me)\//i.test(url)) {
    WebApp.openTelegramLink(url);
  } else {
    WebApp.openLink(url);
  }
}

export default function Tasks() {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [balance, setBalance] = useState(0);

  // taskId -> Claim-in aktiv olacağı vaxt (ms)
  const [readyAt, setReadyAt] = useState<Record<string, number>>({});
  const [claiming, setClaiming] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // İlkin yükləmə
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        WebApp.ready();
        WebApp.expand();

        const user = WebApp.initDataUnsafe?.user;
        if (!user) {
          if (!cancelled) setLoad({ status: 'no-telegram' });
          return;
        }

        const [profile, activeTasks, doneIds] = await Promise.all([
          getOrCreateProfile(user.id, user.username ?? null),
          fetchActiveTasks(),
          fetchCompletedTaskIds(user.id),
        ]);

        if (cancelled) return;
        setTelegramId(user.id);
        setBalance(profile.lxr_balance);
        setTasks(activeTasks);
        setCompleted(doneIds);
        setLoad({ status: 'ready' });
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setLoad({
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

  // Geri sayım taymeri (yalnız gözləyən tapşırıq olanda işləyir)
  const hasPending = Object.values(readyAt).some((t) => t > now);
  useEffect(() => {
    if (!hasPending) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [hasPending]);

  // Toast avtomatik bağlansın
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const handleStart = useCallback((task: Task) => {
    if (task.url) openTaskLink(task.url);
    setNow(Date.now());
    setReadyAt((prev) => ({
      ...prev,
      [task.id]: Date.now() + (task.url ? CLAIM_DELAY_SEC * 1000 : 0),
    }));
  }, []);

  const handleClaim = useCallback(
    async (task: Task) => {
      if (telegramId === null || claiming) return;
      setClaiming(task.id);

      try {
        const newBalance = await claimTask(telegramId, task.id);
        setBalance(newBalance);
        setCompleted((prev) => new Set(prev).add(task.id));
        setToast({ type: 'success', text: `+${formatLxr(task.reward)} LXR hesabınıza əlavə olundu` });
        WebApp.HapticFeedback?.notificationOccurred('success');
      } catch (err) {
        if (err instanceof ClaimError && err.code === 'ALREADY_CLAIMED') {
          setCompleted((prev) => new Set(prev).add(task.id));
        }
        setToast({ type: 'error', text: err instanceof Error ? err.message : 'Xəta baş verdi.' });
        WebApp.HapticFeedback?.notificationOccurred('error');
      } finally {
        setClaiming(null);
      }
    },
    [telegramId, claiming]
  );

  const doneCount = tasks.filter((t) => completed.has(t.id)).length;

  return (
    <main className="min-h-screen bg-[#0a0e1a] px-5 pb-12 pt-8 text-slate-100">
      <div className="mx-auto w-full max-w-md">
        {load.status === 'loading' && <Skeleton />}

        {load.status === 'no-telegram' && (
          <Notice title="Telegram-dan açın" text="Tapşırıqlar yalnız Telegram daxilində işləyir." />
        )}

        {load.status === 'error' && (
          <Notice
            title="Tapşırıqlar yüklənmədi"
            text={load.message}
            actionLabel="Yenidən cəhd et"
            onAction={() => window.location.reload()}
          />
        )}

        {load.status === 'ready' && (
          <>
            <header>
              <h1 className="text-2xl font-semibold tracking-tight">Tapşırıqlar</h1>
              <p className="mt-1 text-sm text-slate-400">
                {tasks.length > 0
                  ? `${doneCount} / ${tasks.length} tamamlanıb`
                  : 'Hazırda aktiv tapşırıq yoxdur'}
              </p>
              <p className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums">{formatLxr(balance)}</span>
                <span className="font-medium text-[#5eead4]">LXR</span>
              </p>
            </header>

            {toast && (
              <div
                role="status"
                className={`mt-5 rounded-2xl px-4 py-3 text-sm font-medium ${
                  toast.type === 'success'
                    ? 'bg-[#5eead4]/15 text-[#5eead4]'
                    : 'bg-rose-500/15 text-rose-300'
                }`}
              >
                {toast.text}
              </div>
            )}

            <ul className="mt-6 space-y-3">
              {tasks.map((task) => {
                const isDone = completed.has(task.id);
                const ready = readyAt[task.id];
                const started = ready !== undefined;
                const secondsLeft = started ? Math.max(0, Math.ceil((ready - now) / 1000)) : 0;

                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isDone={isDone}
                    started={started}
                    secondsLeft={secondsLeft}
                    isClaiming={claiming === task.id}
                    onStart={() => handleStart(task)}
                    onClaim={() => handleClaim(task)}
                  />
                );
              })}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}

function TaskCard({
  task,
  isDone,
  started,
  secondsLeft,
  isClaiming,
  onStart,
  onClaim,
}: {
  task: Task;
  isDone: boolean;
  started: boolean;
  secondsLeft: number;
  isClaiming: boolean;
  onStart: () => void;
  onClaim: () => void;
}) {
  const badge = task.type === 'telegram' ? 'TG' : task.type === 'twitter' ? 'X' : '★';

  return (
    <li className="flex items-center gap-4 rounded-2xl border border-white/5 bg-[#101728] p-4">
      <div
        aria-hidden
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#162036] text-sm font-semibold text-[#5eead4]"
      >
        {badge}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{task.title}</p>
        <p className="mt-0.5 text-sm text-slate-400">
          {task.description ? `${task.description} · ` : ''}
          <span className="font-medium tabular-nums text-[#5eead4]">+{formatLxr(task.reward)} LXR</span>
        </p>
      </div>

      <div className="shrink-0">
        {isDone ? (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-sm font-medium text-slate-300">
            <svg viewBox="0 0 20 20" className="h-4 w-4 text-[#5eead4]" fill="currentColor" aria-hidden>
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z"
                clipRule="evenodd"
              />
            </svg>
            Completed
          </span>
        ) : !started ? (
          <button
            type="button"
            onClick={onStart}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold transition active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5eead4]"
          >
            Start
          </button>
        ) : (
          <button
            type="button"
            onClick={onClaim}
            disabled={secondsLeft > 0 || isClaiming}
            className="min-w-[84px] rounded-xl bg-[#5eead4] px-4 py-2 text-sm font-semibold text-[#06201c] transition active:scale-[0.97] disabled:bg-white/10 disabled:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5eead4]"
          >
            {isClaiming ? '…' : secondsLeft > 0 ? `${secondsLeft}s` : 'Claim'}
          </button>
        )}
      </div>
    </li>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Yüklənir">
      <div className="h-7 w-40 rounded bg-[#162036]" />
      <div className="mt-3 h-4 w-28 rounded bg-[#162036]" />
      <div className="mt-8 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[76px] rounded-2xl bg-[#101728]" />
        ))}
      </div>
    </div>
  );
}

function Notice({
  title,
  text,
  actionLabel,
  onAction,
}: {
  title: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div role="alert" className="mt-16 rounded-3xl border border-white/5 bg-[#101728] p-6 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-2xl bg-[#5eead4] px-5 py-2.5 text-sm font-semibold text-[#06201c]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
