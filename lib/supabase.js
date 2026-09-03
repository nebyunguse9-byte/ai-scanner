import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hdowiwgssrjovfqkrber.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhkb3dpd2dhc21qb3ZmcWtyYmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0Mjc5MzEsImV4cCI6MjEwNDAwMzkzMX0.Ef7wD53PwfcRJcDqLHg9pwdkq8PxlLu3slYd8SQ0FHs";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
