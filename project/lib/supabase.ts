import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if Supabase is properly configured (not using placeholder values)
const isSupabaseConfigured = supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-ref') && 
  !supabaseAnonKey.includes('your-anon-key-here')

if (!isSupabaseConfigured) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')
}

if (supabaseUrl?.includes('your-project-ref') || supabaseAnonKey?.includes('your-anon-key-here')) {
  console.error('Supabase environment variables contain placeholder values. Please update with your actual Supabase project credentials.')
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false
      }
    })
  : null

export const isSupabaseReady = () => {
  return supabase !== null
}