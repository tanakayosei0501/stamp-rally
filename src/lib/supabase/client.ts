// =============================================
// ブラウザ(クライアント)用 Supabase クライアント
// ユーザーのブラウザで実行されるコード内で使います
// =============================================
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
