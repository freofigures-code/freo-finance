/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oswtttmqflupmpjssflz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zd3R0dG1xZmx1cG1wanNzZmx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5ODQ3MTUsImV4cCI6MjA5MjU2MDcxNX0.1CGyHISXtJ0u0S2igf9M97Q-U0hZ_RighBEiWPE5vcw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
