import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Entry {
  id: string;
  number: string;
  name: string;
  address: string;
  entry_time: string;
  exit_time: string | null;
  status: 'entered' | 'exited';
  created_at: string;
}
