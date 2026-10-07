'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { getOrCreateProfile } from '@/lib/supabaseClient';
import {
  MIN_WITHDRAW,
  WithdrawError,
  clearWallet,
  fetchSavedWallet,
  fetchWithdrawals,
  isValidAddress,
  isValidAmountFormat,
  requestWithdrawal,
  saveWallet,
  toCents,
  type Withdrawal,
  type WithdrawalStatus,
} from '@/lib/withdrawApi';

type LoadState =
  | { status: 'loading' }
  | { status: 'no-telegram' }
  | { status: 'error'; message: string }
  | { status: 'ready' };

const formatLxr = (v: number) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const confirmDialog = (message: string) =>
  new Promise<boolean>((resolve) => WebApp.showConfirm(message, (ok) => resolve(ok)));

export default function Withdraw() {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<Withdrawal[]>([]);

  const [savedWallet, setSavedWallet] = useState<string | null>(null);
  const [wallet, setWallet] = useState('');
  const [amount, setAmount] = useState('');
  const [remember, setRemember] = useState(true);
  const [touched, setTouched] = useState({ wallet: false, amount: false });

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ---------- İlkin yükləmə ----------
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

        const [profile, saved, list] = await Promise.all([
          getOrCreateProfile(user.id, user.username ?? null),
          fetchSavedWallet(user.id),
          fetchWithdrawals(user.id),
        ]);

        if (cancelled) return;
        setTelegramId(user.id);
        setBalance(profile.lxr_balance);
        setSavedWallet(saved);
        setWallet(saved ?? '');
        setRemember(!saved);
        setHistory(list);
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

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  // ---------- Validasiya ----------
  const walletError = useMemo(() => {
    if (!wallet.trim()) return 'Cüzdan ünvanını daxil edin.';
    if (!isValidAddress(wallet)) return 'Ünvan 0x ilə başlamalı və 42 simvoldan ibarət olmalıdır.';
    return null;
  }, [wallet]);

  const amountError = useMemo(() => {
    if (!amount.trim()) return 'Məbləği daxil edin.';
    if (!isValidAmountFormat(amount)) return 'Yalnız rəqəm yazın (maksimum 2 onluq).';
    const cents = toCents(amount);
    if (cents < MIN_WITHDRAW * 100) return `Minimum məbləğ ${MIN_WITHDRAW} LXR-dir.`;
    if (cents > toCents(balance)) return 'Məbləğ balansınızdan çox ola bilməz.';
    return null;
  }, [amount, balance]);

  const canSubmit = !walletError && !amountError && !submitting;
  const canWithdraw = toCents(balance) >= MIN_WITHDRAW * 100;

  // ---------- Əməliyyatlar ----------
  const handleMax = () => {
    setAmount(balance.toFixed(2));
    setTouched((t) => ({ ...t, amount: true }));
  };

  const handleForgetWallet = async () => {
    if (telegramId === null) return;
    try {
      await clearWallet(telegramId);
      setSavedWallet(null);
      setWallet('');
      setRemember(true);
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', text: 'Cüzdan silinmədi.' });
    }
  };

  const handleSubmit = useCallback(async () => {
    setTouched({ wallet: true, amount: true });
    if (telegramId === null || walletError || amountError || submitting) return;

    const normalized = Number(amount).toFixed(2);
    const ok = await confirmDialog(
      `${formatLxr(Number(normalized))} LXR bu ünvana göndərilsin?\n\n${wallet.trim()}\n\nŞəbəkə: Polygon`
    );
    if (!ok) return;

    setSubmitting(true);
    try {
      const result = await requestWithdrawal(telegramId, normalized, wallet);
      setBalance(result.balance);
      setAmount('');
      setTouched({ wallet: false, amount: false });

      if (remember && wallet.trim() !== savedWallet) {
        try {
          await saveWallet(telegramId, wallet);
          setSavedWallet(wallet.trim());
          setRemember(false);
        } catch (e) {
          console.error('Cüzdan saxlanmadı:', e);
        }
      }

      setHistory(await fetchWithdrawals(telegramId));
      setToast({ type: 'success', text: 'Sorğu göndərildi. Status: Pending' });
      WebApp.HapticFeedback?.notificationOccurred('success');
    } catch (err) {
      setToast({
        type: 'error',
        text: err instanceof WithdrawError ? err.message : 'Xəta baş verdi.',
      });
      WebApp.HapticFeedback?.notificationOccurred('error');
    } finally {
      setSubmitting(false);
    }
  }, [telegramId, walletError, amountError, submitting, amount, wallet, remember, savedWallet]);

  // ---------- Render ----------
  return (
    <main className="min-h-screen bg-[#0a0e1a] px-5 pb-12 pt-8 text-slate-100">
      <div className="mx-auto w-full max-w-md">
        {load.status === 'loading' && <Skeleton />}

        {load.status === 'no-telegram' && (
          <Notice title="Telegram-dan açın" text="Çıxarış yalnız Telegram daxilində işləyir." />
        )}

        {load.status === 'error' && (
          <Notice
            title="Səhifə yüklənmədi"
            text={load.message}
            actionLabel="Yenidən cəhd et"
            onAction={() => window.location.reload()}
          />
        )}

        {load.status === 'ready' && (
          <>
            <header>
              <h1 className="text-2xl font-semibold tracking-tight">Çıxarış</h1>
              <p className="mt-1 text-sm text-slate-400">LXR tokenlərini Polygon cüzdanınıza göndərin</p>
              <p className="mt-4 text-sm text-slate-400">Mövcud balans</p>
              <p className="flex items-baseline gap-2">
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

            <section className="mt-6 space-y-5 rounded-3xl border border-white/5 bg-[#101728] p-5">
              {/* Cüzdan */}
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="wallet" className="text-sm font-medium">
                    Polygon cüzdan ünvanı
                  </label>
                  {savedWallet && (
                    <button
                      type="button"
                      onClick={handleForgetWallet}
                      className="text-xs text-slate-400 underline underline-offset-2"
                    >
                      Cüzdanı sil ({shortAddr(savedWallet)})
                    </button>
                  )}
                </div>
                <input
                  id="wallet"
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  placeholder="0x…"
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, wallet: true }))}
                  aria-invalid={touched.wallet && !!walletError}
                  aria-describedby="wallet-error"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0a0e1a] px-4 py-3 font-mono text-sm outline-none transition placeholder:text-slate-600 focus:border-[#5eead4]"
                />
                <p id="wallet-error" className="mt-1.5 min-h-[1.25rem] text-xs text-rose-300">
                  {touched.wallet ? walletError : ''}
                </p>

                {wallet.trim() !== savedWallet && (
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 accent-[#5eead4]"
                    />
                    Bu ünvanı hesabıma bağla
                  </label>
                )}
              </div>

              {/* Məbləğ */}
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="amount" className="text-sm font-medium">
                    Məbləğ
                  </label>
                  <span className="text-xs text-slate-400">Minimum: {MIN_WITHDRAW} LXR</span>
                </div>
                <div className="relative mt-2">
                  <input
                    id="amount"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(',', '.'))}
                    onBlur={() => setTouched((t) => ({ ...t, amount: true }))}
                    aria-invalid={touched.amount && !!amountError}
                    aria-describedby="amount-error"
                    className="w-full rounded-2xl border border-white/10 bg-[#0a0e1a] py-3 pl-4 pr-20 text-lg tabular-nums outline-none transition placeholder:text-slate-600 focus:border-[#5eead4]"
                  />
                  <button
                    type="button"
                    onClick={handleMax}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold"
                  >
                    Max
                  </button>
                </div>
                <p id="amount-error" className="mt-1.5 min-h-[1.25rem] text-xs text-rose-300">
                  {touched.amount ? amountError : ''}
                </p>
              </div>

              {!canWithdraw && (
                <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">
                  Çıxarış üçün balansınız ən azı {MIN_WITHDRAW} LXR olmalıdır.
                </p>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || !canWithdraw}
                className="w-full rounded-2xl bg-[#5eead4] py-3.5 text-sm font-semibold text-[#06201c] transition active:scale-[0.98] disabled:bg-white/10 disabled:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5eead4]"
              >
                {submitting ? 'Göndərilir…' : 'Çıxarış sorğusu göndər'}
              </button>

              <p className="text-xs leading-relaxed text-slate-500">
                Sorğu Pending statusu ilə yaradılır və məbləğ balansınızdan dərhal çıxılır. Sorğu rədd
                edilərsə, məbləğ geri qaytarılır. Yalnız Polygon şəbəkəsinin ünvanını daxil edin; səhv
                şəbəkəyə göndərilən tokenlər bərpa olunmur.
              </p>
            </section>

            {/* Tarixçə */}
            <section className="mt-8" aria-labelledby="history-title">
              <h2 id="history-title" className="text-lg font-semibold">
                Son sorğular
              </h2>
              {history.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">Hələ çıxarış sorğunuz yoxdur.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {history.map((w) => (
                    <li
                      key={w.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-[#101728] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium tabular-nums">{formatLxr(w.amount)} LXR</p>
                        <p className="truncate text-xs text-slate-400">
                          {shortAddr(w.wallet_address)} · {new Date(w.created_at).toLocaleDateString('az-AZ')}
                        </p>
                        {w.status === 'completed' && w.tx_hash && (
                          <button
                            type="button"
                            onClick={() => WebApp.openLink(`https://polygonscan.com/tx/${w.tx_hash}`)}
                            className="mt-0.5 text-xs text-[#5eead4] underline underline-offset-2"
                          >
                            Polygonscan-da bax
                          </button>
                        )}
                      </div>
                      <StatusBadge status={w.status} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

const STATUS_STYLES: Record<WithdrawalStatus, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'bg-amber-400/15 text-amber-300' },
  processing: { label: 'Processing', cls: 'bg-sky-400/15 text-sky-300' },
  completed: { label: 'Completed', cls: 'bg-[#5eead4]/15 text-[#5eead4]' },
  rejected: { label: 'Rejected', cls: 'bg-rose-500/15 text-rose-300' },
};

function StatusBadge({ status }: { status: WithdrawalStatus }) {
  const s = STATUS_STYLES[status];
  return <span className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}

function Skeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Yüklənir">
      <div className="h-7 w-32 rounded bg-[#162036]" />
      <div className="mt-3 h-4 w-56 rounded bg-[#162036]" />
      <div className="mt-8 h-72 rounded-3xl bg-[#101728]" />
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