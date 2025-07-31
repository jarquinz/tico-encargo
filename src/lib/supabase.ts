import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para TypeScript
export interface Client {
  id: number
  name: string
  phone: string
  current_debt: number
  notes: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: number
  client_id: number
  type: 'payment' | 'debt'
  amount: number
  date: string
  description: string
  created_at: string
} 