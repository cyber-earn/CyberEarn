'use client';

import { useCallback, useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';

type TaskType = 'telegram' | 'twitter' | 'other';

interface PendingWithdrawal {
  id: string;
  telegram_id: number;
  username: string | null;
  amount: number;
  wallet_address: string;
  network: string;
  created_at: string;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'no-telegram' }
  | { status: 'forbidden'; message: string }
  | { status: 'error'; message: string }
  | { status: 'ready' };

class ApiError extends Error {
  constructor(public httpStatus: number, message: string) {
    super(message);
  }
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-init-data': WebApp.initData,
      ...(init?.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (json as { error?: string }).error ?? 'Xəta baş verdi.');
  return json as T;
}

const formatLxr = (v: number) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

const confirmDialog = (message: string) =>
  new Promise<boolean>((resolve) => WebApp.showConfirm(message, (ok) => resolve(ok)));

const EMPTY_FORM = { title: '', description: '', reward: '', url: '', type: 'telegram' as TaskType };

const inputCls =
  'mt-1.5 w-full rounded-2xl border border-white/10 bg-[#0a0e1a] px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-[#5eead4]';

export default function Admin() {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [pending, setPending] = useState<PendingWithdrawal[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const notify = (type: 'success' | 'error', text: string) => setToast({ type, text });

  const loadPending = useCallback(async () => {
    const { withdrawals } = await adminFetch<{ withdrawals: PendingWithdrawal[] }>('/api/admin/withdrawals');
    setPending(withdrawals);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      WebApp.ready();
      WebApp.expand();

      if (!WebApp.initData) {
        if (!cancelled) setLoad({ status: 'no-telegram' });
        return;
      }

      try {
        await loadPending();
        if (!cancelled) setLoad({ status: 'ready' });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && (err.httpStatus === 401 || err.httpStatus === 403)) {
          setLoad({ status: 'forbidden', message: err.message });
        } else {
          setLoad({ status: 'error', message: err instanceof Error ? err.message : 'Naməlum xəta.' });
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [loadPending]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  // ---------- Yeni tapşırıq ----------
  const urlRequired = form.type !== 'other';
  const formError = (() => {
    if (!form.title.trim()) return 'Başlıq daxil edin.';
    if (!/^\d+(\.\d{1,2})?$/.test(form.reward.trim()) || Number(form.reward) <= 0)
      return 'Məbləğ 0-dan böyük rəqəm olmalıdır.';
    if (urlRequired && !form.url.trim()) return 'Bu növ üçün link tələb olunur.';
    if (form.url.trim() && !/^https:\/\//i.test(form.url.trim())) return 'Link https:// ilə başlamalıdır.';
    return null;
  })();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formError || creating) return;

    setCreating(true);
    try {
      await adminFetch('/api/admin/tasks', { method: 'POST', body: JSON.stringify(form) });
      setForm(EMPTY_FORM);
      notify('success', 'Tapşırıq əlavə olundu.');
      WebApp.HapticFeedback?.notificationOccurred('success');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Xəta baş verdi.');
      WebApp.HapticFeedback?.notificationOccurred('error');
    } finally {
      setCreating(false);
    }
  };

  // ---------- Çıxarış sorğuları ----------
  const handleResolve = async (w: PendingWithdrawal, status: 'approved' | 'rejected') => {
    if (busyId) return;

    const who = w.username ? `@${w.username}` : `ID ${w.telegram_id}`;
    const action =
      status === 'approved'
        ? 'təsdiqlənsin'
        : 'rədd edilsin (məbləğ istifadəçinin balansına qaytarılacaq)';
    const ok = await confirmDialog(`${who} — ${formatLxr(w.amount)} LXR\n\nSorğu ${action}?`);
    if (!ok) return;

    setBusyId(w.id);
    try {
      await adminFetch('/api/admin/withdrawals', {
        method: 'PATCH',
        body: JSON.stringify({ id: w.id, status }),
      });
      setPending((prev) => prev.filter((x) => x.id !== w.id));
      notify('success', status === 'approved' ? 'Sorğu təsdiqləndi.' : 'Sorğu rədd edildi, balans qaytarıldı.');
      WebApp.HapticFeedback?.notificationOccurred('success');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Xəta baş verdi.');
      WebApp.HapticFeedback?.notificationOccurred('error');
      // Sorğu artıq emal olunubsa siyahını təzələ
      if (err instanceof ApiError && err.httpStatus === 409) loadPending().catch(() => {});
    } finally {
      setBusyId(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadPending();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Yenilənmədi.');
    } finally {
      setRefreshing(false);
    }
  };

  const copyWallet = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      notify('success', 'Ünvan kopyalandı.');
    } catch {
      notify('error', 'Kopyalamaq alınmadı. Ünvanı əllə seçin.');
    }
  };

  const totalPending = pending.reduce((s, w) => s + w.amount, 0);

  // ---------- Render ----------
  return (
    <main className="min-h-screen bg-[#0a0e1a] px-5 pb-12 pt-8 text-slate-100">
      <div className="mx-auto w-full max-w-md">
        {load.status === 'loading' && <Skeleton />}

        {load.status === 'no-telegram' && (
          <Notice title="Telegram-dan açın" text="Admin paneli yalnız Telegram Mini App daxilində işləyir." />
        )}

        {load.status === 'forbidden' && <Notice title="Giriş qadağandır" text={load.message} />}

        {load.status === 'error' && (
          <Notice
            title="Panel yüklənmədi"
            text={load.message}
            actionLabel="Yenidən cəhd et"
            onAction={() => window.location.reload()}
          />
        )}

        {load.status === 'ready' && (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Admin paneli</h1>

            {toast && (
              <div
                role="status"
                className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${
                  toast.type === 'success'
                    ? 'bg-[#5eead4]/15 text-[#5eead4]'
                    : 'bg-rose-500/15 text-rose-300'
                }`}
              >
                {toast.text}
              </div>
            )}

            {/* Yeni tapşırıq */}
            <section className="mt-6 rounded-3xl border border-white/5 bg-[#101728] p-5" aria-labelledby="new-task">
              <h2 id="new-task" className="text-lg font-semibold">
                Yeni tapşırıq
              </h2>

              <form onSubmit={handleCreate} className="mt-4 space-y-4" noValidate>
                <div>
                  <label htmlFor="title" className="text-sm font-medium">
                    Başlıq
                  </label>
                  <input
                    id="title"
                    type="text"
                    maxLength={100}
                    placeholder="Join Telegram"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label htmlFor="description" className="text-sm font-medium">
                    Açıqlama
                  </label>
                  <textarea
                    id="description"
                    rows={2}
                    maxLength={300}
                    placeholder="Rəsmi kanala qoşul"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className={`${inputCls} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reward" className="text-sm font-medium">
                      Məbləğ (LXR)
                    </label>
                    <input
                      id="reward"
                      type="text"
                      inputMode="decimal"
                      placeholder="50"
                      value={form.reward}
                      onChange={(e) => setForm({ ...form, reward: e.target.value.replace(',', '.') })}
                      className={`${inputCls} tabular-nums`}
                    />
                  </div>
                  <div>
                    <label htmlFor="type" className="text-sm font-medium">
                      Növ
                    </label>
                    <select
                      id="type"
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value as TaskType })}
                      className={inputCls}
                    >
                      <option value="telegram">Telegram</option>
                      <option value="twitter">Twitter</option>
                      <option value="other">Digər</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="url" className="text-sm font-medium">
                    Link {urlRequired ? '' : '(könüllü)'}
                  </label>
                  <input
                    id="url"
                    type="url"
                    inputMode="url"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder={form.type === 'twitter' ? 'https://x.com/…' : 'https://t.me/…'}
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    className={inputCls}
                  />
                </div>

                <p className="min-h-[1.25rem] text-xs text-rose-300">
                  {form.title || form.reward || form.url ? formError : ''}
                </p>

                <button
                  type="submit"
                  disabled={!!formError || creating}
                  className="w-full rounded-2xl bg-[#5eead4] py-3.5 text-sm font-semibold text-[#06201c] transition active:scale-[0.98] disabled:bg-white/10 disabled:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5eead4]"
                >
                  {creating ? 'Əlavə olunur…' : 'Tapşırıq əlavə et'}
                </button>
              </form>
            </section>

            {/* Gözləyən çıxarışlar */}
            <section className="mt-8" aria-labelledby="pending-title">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 id="pending-title" className="text-lg font-semibold">
                    Gözləyən çıxarışlar
                  </h2>
                  <p className="text-sm text-slate-400">
                    {pending.length > 0
                      ? `${pending.length} sorğu · cəmi ${formatLxr(totalPending)} LXR`
                      : 'Gözləyən sorğu yoxdur'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold disabled:opacity-60"
                >
                  {refreshing ? '…' : 'Yenilə'}
                </button>
              </div>

              <ul className="mt-4 space-y-3">
                {pending.map((w) => (
                  <li key={w.id} className="rounded-2xl border border-white/5 bg-[#101728] p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate font-medium">
                        {w.username ? `@${w.username}` : `ID ${w.telegram_id}`}
                      </p>
                      <p className="shrink-0 font-semibold tabular-nums text-[#5eead4]">
                        {formatLxr(w.amount)} LXR
                      </p>
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      ID {w.telegram_id} · {new Date(w.created_at).toLocaleString('az-AZ')} · {w.network}
                    </p>

                    <div className="mt-3 flex items-start gap-2">
                      <p className="min-w-0 flex-1 select-all break-all rounded-xl bg-[#0a0e1a] px-3 py-2 font-mono text-xs">
                        {w.wallet_address}
                      </p>
                      <button
                        type="button"
                        onClick={() => copyWallet(w.wallet_address)}
                        className="shrink-0 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold"
                      >
                        Copy
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleResolve(w, 'rejected')}
                        disabled={busyId !== null}
                        className="rounded-xl bg-rose-500/15 py-2.5 text-sm font-semibold text-rose-300 transition active:scale-[0.97] disabled:opacity-50"
                      >
                        {busyId === w.id ? '…' : 'Reject'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolve(w, 'approved')}
                        disabled={busyId !== null}
                        className="rounded-xl bg-[#5eead4] py-2.5 text-sm font-semibold text-[#06201c] transition active:scale-[0.97] disabled:opacity-50"
                      >
                        {busyId === w.id ? '…' : 'Approve'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Yüklənir">
      <div className="h-7 w-40 rounded bg-[#162036]" />
      <div className="mt-6 h-96 rounded-3xl bg-[#101728]" />
      <div className="mt-6 h-32 rounded-2xl bg-[#101728]" />
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
