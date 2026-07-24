import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ShopClient from "@/components/shop/ShopClient";

export default async function ShopPage() {
  noStore();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 累積獲得ポイント（全達成数）— 2ステップ: goal_id 取得 → 達成数カウント
  const { data: userGoals } = await supabase
    .from("goals")
    .select("id")
    .eq("user_id", user.id);
  const goalIds = (userGoals ?? []).map((g) => g.id);

  const { count: totalEarned } = goalIds.length > 0
    ? await supabase
        .from("achievements")
        .select("id", { count: "exact", head: true })
        .eq("achieved", true)
        .in("goal_id", goalIds)
    : { count: 0 };

  // 購入済みアイテム
  const { data: ownedItems } = await supabase
    .from("user_items")
    .select("item_type, item_id, cost")
    .eq("user_id", user.id);

  const ownedStamps     = (ownedItems ?? []).filter((i) => i.item_type === "stamp").map((i) => i.item_id);
  const ownedCharacters = (ownedItems ?? []).filter((i) => i.item_type === "character").map((i) => i.item_id);
  const spent           = (ownedItems ?? []).reduce((s, i) => s + i.cost, 0);
  const balance         = (totalEarned ?? 0) - spent;

  // 現在の設定
  const { data: profile } = await supabase
    .from("profiles")
    .select("active_stamp, active_character")
    .eq("id", user.id)
    .single();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">🛍️ スタンプショップ</h1>
        <p className="text-sm text-gray-500">貯めたスタンプポイントでアイテムをゲット！</p>
      </div>

      <ShopClient
        balance={balance}
        ownedStamps={ownedStamps}
        ownedCharacters={ownedCharacters}
        activeStamp={profile?.active_stamp ?? "default"}
        activeCharacter={profile?.active_character ?? "plant"}
      />
    </div>
  );
}
