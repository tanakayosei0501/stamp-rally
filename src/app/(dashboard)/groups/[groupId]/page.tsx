// =============================================
// グループ詳細ページ /groups/[groupId]
// メンバーごとの今月の目標とスタンプ状況を表示
// =============================================
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import HistoryMonthSelector from "@/components/history/HistoryMonthSelector";
import MemberGoalsSection from "@/components/groups/MemberGoalsSection";
import type { Achievement } from "@/types/database";

type Props = {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ month?: string }>;
};

export default async function GroupDetailPage({ params, searchParams }: Props) {
  noStore();

  const { groupId } = await params;
  const { month } = await searchParams;

  const now = new Date();
  const todayStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const currentMonth = todayStr.slice(0, 7);
  const targetMonth = (month && month <= currentMonth) ? month : currentMonth;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // グループ情報とメンバー一覧を取得（RLS により参加グループのみ取得可）
  const { data: group } = await supabase
    .from("groups")
    .select("id, name, invite_code, group_members(user_id, profiles(id, display_name))")
    .eq("id", groupId)
    .single();

  // 参加していないグループならリダイレクト
  if (!group) redirect("/groups");

  const memberIds: string[] = (group.group_members ?? []).map(
    (gm: { user_id: string }) => gm.user_id
  );

  // 選択月のメンバー全員の目標＋達成記録を取得
  // （goals の RLS により同グループメンバーの目標が見える）
  const { data: allGoals } = await supabase
    .from("goals")
    .select("*, achievements(*)")
    .eq("target_month", targetMonth)
    .in("user_id", memberIds)
    .order("created_at");

  // userId → goals のマップを作成
  const goalsByUser = new Map<string, { goals: typeof allGoals; stamps: number; achievedToday: boolean }>();
  for (const id of memberIds) {
    const userGoals = (allGoals ?? []).filter((g) => g.user_id === id);
    const stamps = userGoals.reduce(
      (sum, g) => sum + ((g.achievements as Achievement[]).filter((a) => a.achieved).length),
      0
    );
    const achievedToday = userGoals.some((g) =>
      (g.achievements as Achievement[]).some((a) => a.date === todayStr && a.achieved)
    );
    goalsByUser.set(id, { goals: userGoals, stamps, achievedToday });
  }

  // 自分を先頭、他メンバーはスタンプ数降順でソート
  const sortedMembers = [...(group.group_members ?? [])].sort((a, b) => {
    if (a.user_id === user.id) return -1;
    if (b.user_id === user.id) return 1;
    return (goalsByUser.get(b.user_id)?.stamps ?? 0) - (goalsByUser.get(a.user_id)?.stamps ?? 0);
  });

  const displayMonth = (() => {
    const [y, m] = targetMonth.split("-");
    return `${y}年${parseInt(m)}月`;
  })();

  return (
    <div>
      {/* 戻るボタン＋タイトル */}
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/groups"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white shadow-sm text-gray-500 hover:bg-gray-50 transition-colors text-lg"
        >
          ‹
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{group.name}</h1>
          <p className="text-sm text-gray-500">{displayMonth} · {memberIds.length}人</p>
        </div>
      </div>

      {/* 月セレクター */}
      <HistoryMonthSelector
        value={targetMonth}
        currentMonth={currentMonth}
        basePath={`/groups/${groupId}`}
      />

      {/* メンバーごとの目標一覧 */}
      <div>
        {sortedMembers.map((gm) => {
          const profile = Array.isArray(gm.profiles) ? gm.profiles[0] : gm.profiles;
          const displayName = (profile as { display_name: string } | null)?.display_name ?? "?";
          const data = goalsByUser.get(gm.user_id) ?? { goals: [], stamps: 0, achievedToday: false };

          return (
            <MemberGoalsSection
              key={gm.user_id}
              userId={gm.user_id}
              displayName={displayName}
              isMe={gm.user_id === user.id}
              goals={(data.goals ?? []).map((g) => ({
                ...g,
                achievements: (g.achievements as Achievement[]) ?? [],
              }))}
              totalStamps={data.stamps}
              achievedToday={data.achievedToday}
            />
          );
        })}
      </div>
    </div>
  );
}
