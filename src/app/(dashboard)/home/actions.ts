"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// スタンプのトグル（押す/取り消す）
export async function toggleAchievement(goalId: string, date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // その日の記録が既にあるか確認
  const { data: existing } = await supabase
    .from("achievements")
    .select("id")
    .eq("goal_id", goalId)
    .eq("date", date)
    .maybeSingle();

  if (existing) {
    // 既にスタンプ済み → 取り消す
    await supabase.from("achievements").delete().eq("id", existing.id);
  } else {
    // まだ → スタンプを押す
    await supabase.from("achievements").insert({
      goal_id: goalId,
      date: date,
      achieved: true,
    });
  }

  revalidatePath("/home");
}
