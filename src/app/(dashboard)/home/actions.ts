"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// スタンプのトグル（押す/取り消す）
// isRare: クライアント側で決定した5%抽選結果
export async function toggleAchievement(goalId: string, date: string, isRare: boolean = false) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("achievements")
    .select("id")
    .eq("goal_id", goalId)
    .eq("date", date)
    .maybeSingle();

  if (existing) {
    await supabase.from("achievements").delete().eq("id", existing.id);
  } else {
    await supabase.from("achievements").insert({
      goal_id: goalId,
      date,
      achieved: true,
      is_rare: isRare,
    });
  }

  revalidatePath("/home");
}
