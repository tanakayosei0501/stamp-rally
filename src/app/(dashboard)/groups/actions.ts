"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// グループを新規作成して、作成者を自動でメンバーに追加
export async function createGroup(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未ログインです" };

  const name = (formData.get("name") as string).trim();
  if (!name) return { error: "グループ名を入力してください" };

  // グループ作成（invite_code はDBのデフォルト値で自動生成）
  const { data: group, error } = await supabase
    .from("groups")
    .insert({ name, created_by: user.id })
    .select()
    .single();

  if (error || !group) return { error: "グループの作成に失敗しました" };

  // 作成者を自動でメンバーに追加
  await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: user.id });

  revalidatePath("/groups");
  return { success: true };
}

// 招待コードでグループに参加
export async function joinGroup(inviteCode: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未ログインです" };

  // STEPで作成したRPC関数を呼び出す（RLSをバイパスしてグループを検索）
  const { data, error } = await supabase.rpc("join_group_by_invite_code", {
    code: inviteCode.trim(),
  });

  if (error) return { error: "参加に失敗しました" };

  const result = data as { error?: string; success?: boolean; group_name?: string };
  if (result.error === "invalid_code") return { error: "招待コードが正しくありません" };
  if (result.error === "already_member") return { error: "すでにこのグループに参加しています" };

  revalidatePath("/groups");
  return { success: true, groupName: result.group_name };
}

// グループチャレンジを作成（security definer RPC で全メンバー分のゴールを挿入）
export async function createGroupChallenge(
  groupId: string,
  title: string,
  category: string,
  targetMonth: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未ログインです" };

  const { error } = await supabase.rpc("create_group_challenge", {
    p_group_id: groupId,
    p_title: title.trim(),
    p_category: category,
    p_target_month: targetMonth,
  });

  if (error) return { error: "チャレンジの作成に失敗しました" };

  revalidatePath("/groups", "layout");
  revalidatePath("/home");
  return {};
}

// グループから退出
export async function leaveGroup(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  revalidatePath("/groups");
}
