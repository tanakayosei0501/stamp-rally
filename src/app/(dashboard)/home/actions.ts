"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// isAdding: クライアント側で確定した「追加か取り消しか」を明示的に受け取る
// isRare:   クライアント側で決定した5%抽選結果（追加時のみ使用）
export async function toggleAchievement(
  goalId: string,
  date: string,
  isRare: boolean = false,
  isAdding: boolean = true,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  if (isAdding) {
    // 重複防止: unique 制約 (goal_id, date) に任せる。既存行があれば何もしない
    await supabase.from("achievements").insert({
      goal_id: goalId,
      date,
      achieved: true,
      is_rare: isRare,
    });
  } else {
    // SELECT → DELETE(by id) ではなく複合キーで直接 DELETE（より確実）
    await supabase.from("achievements")
      .delete()
      .eq("goal_id", goalId)
      .eq("date", date);
  }

  revalidatePath("/home");
  revalidatePath("/shop");
}
