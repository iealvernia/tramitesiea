import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://odvgmujuhgktfgrtzxwv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kdmdtdWp1aGdrdGZncnR6eHd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNjYzNTQsImV4cCI6MjA3NTc0MjM1NH0.WgYUziTE30h5s35wAw91VAkgM000gm-w3x0agY9pe5c';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
