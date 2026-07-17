"use server";
// =============================================
// 認証に関わるサーバーアクション
// フォームの送信先として使われます
// "use server" = このファイルはサーバー側で実行されます
// =============================================
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// サインアップ(新規登録)
export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("display_name") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // display_name をユーザーメタデータとして保存(トリガーでprofilesに自動コピー)
      data: { display_name: displayName },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/home");
}

// ログイン
export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/home");
}

// ログアウト
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
