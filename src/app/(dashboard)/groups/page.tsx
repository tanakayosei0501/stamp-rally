// =============================================
// グループページ
// =============================================
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import GroupModals from "@/components/groups/GroupModals";
import GroupCard from "@/components/groups/GroupCard";
import type { Achievement } from "@/types/database";

export default async function GroupsPage() {
  noStore();

  const now = new Date();
  const todayStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const currentMonth = todayStr.slice(0, 7);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 自分が所属するグループとメンバー情報を取得
  const { data: groups } = await supabase
    .from("groups")
    .select(`
      id, name, invite_code,
      group_members(
        user_id,
        profiles(id, display_name)
      )
    `)
    .order("created_at");

  // 今月の目標と達成記録を全て取得
  // (更新したRLSにより、同じグループのメンバーの目標も取得できる)
  const { data: allGoals } = await supabase
    .from("goals")
    .select("id, user_id, target_month, achievements(*)")
    .eq("target_month", currentMonth);

  // userId → スタンプ統計 のマップを作成
  const statsMap = new Map<string, { stamps: number; goalCount: number; achievedToday: boolean }>();

  for (const goal of allGoals ?? []) {
    const achievements = (goal.achievements as Achievement[]) ?? [];
    const stamps = achievements.filter((a) => a.achieved).length;
    const achievedToday = achievements.some((a) => a.date === todayStr && a.achieved);

    const existing = statsMap.get(goal.user_id) ?? { stamps: 0, goalCount: 0, achievedToday: false };
    statsMap.set(goal.user_id, {
      stamps: existing.stamps + stamps,
      goalCount: existing.goalCount + 1,
      achievedToday: existing.achievedToday || achievedToday,
    });
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">グループ</h1>
        <p className="text-sm text-gray-500">仲間と一緒に目標を達成しよう</p>
      </div>

      {/* グループ作成・参加ボタン */}
      <GroupModals hasGroups={(groups?.length ?? 0) > 0} />

      {/* グループ一覧 */}
      {!groups || groups.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">👥</div>
          <p className="text-gray-500 font-medium">まだグループに参加していません</p>
          <p className="text-gray-400 text-sm mt-1">
            グループを作成して仲間を招待しましょう！
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            // このグループのメンバー一覧を整形
            // Supabaseは profiles をリレーション配列として返すので [0] で取り出す
            const members = (group.group_members ?? []).map((gm) => {
              const profile = Array.isArray(gm.profiles)
                ? gm.profiles[0]
                : gm.profiles;
              const stats = statsMap.get(gm.user_id) ?? {
                stamps: 0,
                goalCount: 0,
                achievedToday: false,
              };
              return {
                userId: gm.user_id,
                displayName: (profile as { display_name: string } | null)?.display_name ?? "?",
                isMe: gm.user_id === user.id,
                ...stats,
              };
            });

            return (
              <GroupCard
                key={group.id}
                groupId={group.id}
                groupName={group.name}
                inviteCode={group.invite_code}
                members={members}
                currentUserId={user.id}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
