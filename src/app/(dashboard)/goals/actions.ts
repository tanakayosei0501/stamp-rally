"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// 目標を作成する
export async function createGoal(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("goals").insert({
    user_id: user.id,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    target_month: formData.get("target_month") as string,
    category: (formData.get("category") as string) || null,
  });

  revalidatePath("/goals");
  revalidatePath("/home");
}

// 目標を更新する
export async function updateGoal(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const id = formData.get("id") as string;

  await supabase
    .from("goals")
    .update({
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      target_month: formData.get("target_month") as string,
      category: (formData.get("category") as string) || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/goals");
  revalidatePath("/home");
}

// 目標を削除する
export async function deleteGoal(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("goals").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/goals");
  revalidatePath("/home");
}
