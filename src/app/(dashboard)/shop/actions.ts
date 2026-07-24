"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STAMP_ITEMS, CHARACTER_ITEMS } from "@/lib/shopItems";

const ALL_ITEMS = [...STAMP_ITEMS, ...CHARACTER_ITEMS];

// ユーザーの保有ポイント（全達成数）と使用済みコストを計算して残高を返す
async function getBalance(userId: string) {
  const supabase = await createClient();

  // 全期間の達成数（= 累積獲得ポイント）
  const { count: totalEarned } = await supabase
    .from("achievements")
    .select("id", { count: "exact", head: true })
    .eq("achieved", true)
    .filter("goal_id", "in", `(select id from goals where user_id = '${userId}')`);

  // 購入済みアイテムの合計コスト
  const { data: owned } = await supabase
    .from("user_items")
    .select("cost")
    .eq("user_id", userId);

  const spent = (owned ?? []).reduce((s, i) => s + i.cost, 0);
  return (totalEarned ?? 0) - spent;
}

// アイテムを購入する
export async function purchaseItem(itemType: "stamp" | "character", itemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインしてください" };

  const item = ALL_ITEMS.find((i) => i.id === itemId);
  if (!item) return { error: "アイテムが見つかりません" };

  // 残高チェック
  const balance = await getBalance(user.id);
  if (balance < item.cost) return { error: `ポイントが足りません（必要: ${item.cost}、残高: ${balance}）` };

  // 購入
  const { error } = await supabase.from("user_items").insert({
    user_id: user.id,
    item_type: itemType,
    item_id: itemId,
    cost: item.cost,
  });
  if (error) return { error: "購入に失敗しました" };

  // 購入直後にアクティブ化
  if (itemType === "stamp") {
    await supabase.from("profiles").update({ active_stamp: itemId }).eq("id", user.id);
  } else {
    await supabase.from("profiles").update({ active_character: itemId }).eq("id", user.id);
  }

  revalidatePath("/shop");
  revalidatePath("/home");
  return { error: null };
}

// アクティブなアイテムを切り替える
export async function activateItem(itemType: "stamp" | "character", itemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインしてください" };

  const col = itemType === "stamp" ? "active_stamp" : "active_character";
  await supabase.from("profiles").update({ [col]: itemId }).eq("id", user.id);

  revalidatePath("/shop");
  revalidatePath("/home");
  return { error: null };
}
