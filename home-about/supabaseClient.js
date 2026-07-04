import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sqopmjirthqspvskhzas.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxb3BtamlydGhxc3B2c2toemFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNTI0MzgsImV4cCI6MjA5ODcyODQzOH0.rEgbZYzsj-5SkbfAoyllgvsmMr_7eCx7QdC7fiQaFbA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
