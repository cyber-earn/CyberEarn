import { supabase } from './supabase';

export const requestWithdraw = async (amount: number, address: string) => {
  const { data, error } = await supabase.from('withdrawals').insert([{ amount, address }]);
  if (error) throw error;
  return data;
};