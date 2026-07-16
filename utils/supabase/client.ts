import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // 💡 createClientではなく、createBrowserClient を使ってブラウザのCookieと自動同期させる
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}