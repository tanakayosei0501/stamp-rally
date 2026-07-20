"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// リアクションのトグル（追加・種類変更・削除）
// uniqueキーが(achievement_id, user_id)なのでユーザーは1達成記録に1種類のみ
export async function toggleReaction(achievementId: string, type: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("reactions")
    .select("id, type")
    .eq("achievement_id", achievementId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // 既存リアクションを削除
    await supabase.from("reactions").delete().eq("id", existing.id);
    // 別の種類なら新しく追加（同じ種類ならトグルOFFで終了）
    if (existing.type !== type) {
      await supabase.from("reactions").insert({
        achievement_id: achievementId,
        user_id: user.id,
        type,
      });
    }
  } else {
    await supabase.from("reactions").insert({
      achievement_id: achievementId,
      user_id: user.id,
      type,
    });
  }

  revalidatePath("/groups", "layout");
}

export async function addComment(achievementId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed || trimmed.length > 200) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("comments").insert({
    achievement_id: achievementId,
    user_id: user.id,
    body: trimmed,
  });

  revalidatePath("/groups", "layout");
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("comments").delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  revalidatePath("/groups", "layout");
}
