import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import HistoryMonthSelector from "@/components/history/HistoryMonthSelector";
import MemberGoalsSection from "@/components/groups/MemberGoalsSection";
import GroupChallengeCard from "@/components/groups/GroupChallengeCard";
import GroupChallengeModal from "@/components/groups/GroupChallengeModal";
import type { Achievement, Reaction, Comment } from "@/types/database";
import type { CommentWithProfile } from "@/components/groups/GroupGoalCard";

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

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, invite_code, group_members(user_id, profiles(id, display_name))")
    .eq("id", groupId)
    .single();

  if (!group) redirect("/groups");

  const memberIds: string[] = (group.group_members ?? []).map(
    (gm: { user_id: string }) => gm.user_id
  );

  // 選択月の全メンバーの目標＋達成記録（グループチャレンジ含む）
  const { data: allGoals } = await supabase
    .from("goals")
    .select("*, achievements(*)")
    .eq("target_month", targetMonth)
    .in("user_id", memberIds)
    .order("created_at");

  // グループチャレンジと個人目標に分離
  const groupChallengeGoals = (allGoals ?? []).filter((g) => g.group_id === groupId);
  const personalGoals = (allGoals ?? []).filter((g) => !g.group_id);

  // challenge_id でグループチャレンジをまとめる
  const challengeMap = new Map<string, typeof groupChallengeGoals>();
  for (const g of groupChallengeGoals) {
    if (!g.challenge_id) continue;
    const list = challengeMap.get(g.challenge_id) ?? [];
    list.push(g);
    challengeMap.set(g.challenge_id, list);
  }

  // リアクション・コメントは個人目標の達成記録のみ対象
  const allAchievements = personalGoals.flatMap(
    (g) => (g.achievements as Achievement[]).filter((a) => a.achieved)
  );
  const achievementIds = allAchievements.map((a) => a.id);

  const { data: allReactions } = achievementIds.length > 0
    ? await supabase.from("reactions").select("*").in("achievement_id", achievementIds)
    : { data: [] as Reaction[] };

  const { data: rawComments } = achievementIds.length > 0
    ? await supabase
        .from("comments")
        .select("*")
        .in("achievement_id", achievementIds)
        .order("created_at")
    : { data: [] as Comment[] };

  const commentUserIds = [...new Set((rawComments ?? []).map((c) => c.user_id))];
  const { data: commentProfiles } = commentUserIds.length > 0
    ? await supabase.from("profiles").select("id, display_name").in("id", commentUserIds)
    : { data: [] as { id: string; display_name: string }[] };
  const profileNameMap = new Map(
    (commentProfiles ?? []).map((p) => [p.id, p.display_name])
  );
  const allComments: CommentWithProfile[] = (rawComments ?? []).map((c) => ({
    id: c.id,
    achievement_id: c.achievement_id,
    user_id: c.user_id,
    body: c.body,
    created_at: c.created_at,
    display_name: profileNameMap.get(c.user_id) ?? "?",
  }));

  // userId → 個人目標データ のマップ
  const goalsByUser = new Map<string, { goals: typeof personalGoals; stamps: number; achievedToday: boolean }>();
  for (const id of memberIds) {
    const userGoals = personalGoals.filter((g) => g.user_id === id);
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

  // プロフィール lookup ヘルパー
  const profileOf = (gm: { user_id: string; profiles: unknown }) => {
    const p = Array.isArray(gm.profiles) ? gm.profiles[0] : gm.profiles;
    return (p as { display_name: string } | null)?.display_name ?? "?";
  };

  // グループメンバーの display_name マップ
  const memberNameMap = new Map<string, string>(
    (group.group_members ?? []).map((gm) => [gm.user_id, profileOf(gm)])
  );

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

      {/* ─── グループチャレンジセクション ─── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="font-bold text-gray-700">🤝 グループチャレンジ</h2>
          <GroupChallengeModal groupId={groupId} currentMonth={targetMonth} />
        </div>

        {challengeMap.size === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-5 text-center text-gray-400 text-sm">
            <div className="text-3xl mb-2">🤝</div>
            グループ全員で取り組むチャレンジを追加しよう！
          </div>
        ) : (
          <div className="space-y-3">
            {[...challengeMap.entries()].map(([challengeId, challengeGoals]) => {
              const first = challengeGoals[0];
              const members = challengeGoals.map((g) => ({
                userId: g.user_id,
                displayName: memberNameMap.get(g.user_id) ?? "?",
                isMe: g.user_id === user.id,
                goal: { ...g, achievements: (g.achievements as Achievement[]) ?? [] },
              }));
              return (
                <GroupChallengeCard
                  key={challengeId}
                  challengeTitle={first.title}
                  challengeCategory={first.category}
                  targetMonth={first.target_month}
                  members={members}
                  todayStr={todayStr}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ─── メンバーごとの個人目標 ─── */}
      <div>
        <h2 className="font-bold text-gray-700 mb-3 px-1">📋 個人目標</h2>
        {sortedMembers.map((gm) => {
          const displayName = profileOf(gm);
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
              reactions={(allReactions as Reaction[]) ?? []}
              comments={allComments}
              currentUserId={user.id}
            />
          );
        })}
      </div>
    </div>
  );
}
