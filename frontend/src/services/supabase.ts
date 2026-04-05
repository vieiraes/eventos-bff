import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jhzqdelkyghibyylrupx.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoenFkZWxreWdoaWJ5eWxydXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNTQxNzAsImV4cCI6MjA4NjgzMDE3MH0.0y59gzHWws4Qs4AJcamRfM85_YeF0U6c5TEjPDh1-Ec'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Creates a non-persistent Supabase client for operations that must not affect the current session.
 * Use when creating users via signUp() — the auth API automatically signs in the new user,
 * which would log out the current admin. This client uses persistSession: false to prevent that.
 */
export const createEphemeralClient = () =>
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

