import { supabase } from './supabase';

export const getTasks = async () => {
  const { data, error } = await supabase.from('tasks').select('*');
  if (error) throw error;
  return data;
};