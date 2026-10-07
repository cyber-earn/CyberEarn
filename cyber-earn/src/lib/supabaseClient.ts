import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL və NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local faylında təyin olunmalıdır.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Telegram Mini App-da Supabase Auth sessiyası istifadə olunmur
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export interface Profile {
  id: string;
  telegram_id: number;
  username: string | null;
  lxr_balance: number;
  created_at: string;
}

const PG_UNIQUE_VIOLATION = '23505';

async function findProfile(telegramId: number): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('telegram_id', telegramId)
    .maybeSingle();

  if (error) throw error;
  return data ? ({ ...data, lxr_balance: Number(data.lxr_balance) } as Profile) : null;
}

/**
 * Profili telegram_id ilə tapır; yoxdursa yaradır.
 * Username dəyişibsə, yeniləyir.
 */
export async function getOrCreateProfile(
  telegramId: number,
  username: string | null
): Promise<Profile> {
  const existing = await findProfile(telegramId);

  if (existing) {
    if (username && existing.username !== username) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('telegram_id', telegramId)
        .select()
        .single();

      if (error) throw error;
      return { ...data, lxr_balance: Number(data.lxr_balance) } as Profile;
    }
    return existing;
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert({ telegram_id: telegramId, username, lxr_balance: 0 })
    .select()
    .single();

  if (error) {
    // İki paralel sorğu eyni anda profil yaratmağa çalışıbsa
    if (error.code === PG_UNIQUE_VIOLATION) {
      const retry = await findProfile(telegramId);
      if (retry) return retry;
    }
    throw error;
  }

  return { ...data, lxr_balance: Number(data.lxr_balance) } as Profile;
}

/** Yalnız balansı təzələmək üçün */
export async function fetchBalance(telegramId: number): Promise<number> {
  const { data, error } = await supabase
    .from('profiles')
    .select('lxr_balance')
    .eq('telegram_id', telegramId)
    .single();

  if (error) throw error;
  return Number(data.lxr_balance);
}