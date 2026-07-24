"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function sendCheer(groupId: string, toUserId: string, message: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインしてください" };
  if (!message.trim()) return { error: "メッセージを選んでください" };

  const { error } = await supabase.from("cheer_messages").insert({
    from_user_id: user.id,
    to_user_id: toUserId,
    group_id: groupId,
    message: message.trim(),
  });

  if (error) return { error: "送信に失敗しました" };

  revalidatePath(`/groups/${groupId}`);
  return { error: null };
}
