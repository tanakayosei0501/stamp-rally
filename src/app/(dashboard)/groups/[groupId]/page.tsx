import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import HistoryMonthSelector from "@/components/history/HistoryMonthSelector";
import MemberGoalsSection from "@/components/groups/MemberGoalsSection";
import GroupChallengeCard from "@/components/groups/GroupChallengeCard";
import GroupChallengeModal from "@/components/groups/GroupChallengeModal";
import MilestoneBanner from "@/components/groups/MilestoneBanner";
import GroupActivityFeed from "@/components/groups/GroupActivityFeed";
import type { Achievement, Reaction, Comment } from "@/types/database";
import type { CommentWithProfile } from "@/components/groups/GroupGoalCard";
import type { ActivityItem } from "@/components/groups/GroupActivityFeed";

type Props = {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ month?: string }>;
};

// 指定日までの連続達成日数を計算
function calcCurrentStreak(achievedDates: string[], todayStr: string): number {
  const dateSet = new Set(achievedDates);
  let streak = 0;
  const [y, m, d] = todayStr.split("-").map(Number);
  const cur = new Date(y, m - 1, d);
  while (true) {
    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
    if (!dateSet.has(key)) break;
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

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
  const isCurrentMonth = targetMonth === currentMonth;

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

  const { data: allGoals } = await supabase
    .from("goals")
    .select("*, achievements(*)")
    .eq("target_month", targetMonth)
    .in("user_id", memberIds)
    .order("created_at");

  // グループチャレンジと個人目標に分離
  const groupChallengeGoals = (allGoals ?? []).filter((g) => g.group_id === groupId);
  const personalGoals = (allGoals ?? []).filter((g) => !g.group_id);

  // challenge_id でまとめる
  const challengeMap = new Map<string, typeof groupChallengeGoals>();
  for (const g of groupChallengeGoals) {
    if (!g.challenge_id) continue;
    const list = challengeMap.get(g.challenge_id) ?? [];
    list.push(g);
    challengeMap.set(g.challenge_id, list);
  }

  // 個人目標の達成記録のみ対象
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

  // userId → 個人目標データ
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

  // プロフィール lookup
  const profileOf = (gm: { user_id: string; profiles: unknown }) => {
    const p = Array.isArray(gm.profiles) ? gm.profiles[0] : gm.profiles;
    return (p as { display_name: string } | null)?.display_name ?? "?";
  };

  const memberNameMap = new Map<string, string>(
    (group.group_members ?? []).map((gm) => [gm.user_id, profileOf(gm)])
  );

  // 自分を先頭、他はスタンプ数降順
  const sortedMembers = [...(group.group_members ?? [])].sort((a, b) => {
    if (a.user_id === user.id) return -1;
    if (b.user_id === user.id) return 1;
    return (goalsByUser.get(b.user_id)?.stamps ?? 0) - (goalsByUser.get(a.user_id)?.stamps ?? 0);
  });

  // ─── STEP C: グループ合計スタンプ ───
  const challengeStamps = groupChallengeGoals.reduce(
    (sum, g) => sum + (g.achievements as Achievement[]).filter((a) => a.achieved).length,
    0
  );
  const personalStamps = [...goalsByUser.values()].reduce((sum, d) => sum + d.stamps, 0);
  const groupTotalStamps = personalStamps + challengeStamps;

  // ─── STEP C: マイルストーン（7日以上連続達成） ───
  const milestones: { name: string; streak: number }[] = [];
  if (isCurrentMonth) {
    for (const [userId, data] of goalsByUser) {
      const achievedDates = data.goals.flatMap(
        (g) => (g.achievements as Achievement[]).filter((a) => a.achieved).map((a) => a.date)
      );
      const streak = calcCurrentStreak(achievedDates, todayStr);
      if (streak >= 7) {
        milestones.push({ name: memberNameMap.get(userId) ?? "?", streak });
      }
    }
    // streak 降順ソート
    milestones.sort((a, b) => b.streak - a.streak);
  }

  // ─── STEP C: アクティビティフィード ───
  // achievement_id → goal の逆引きマップ
  const achievementToGoalTitle = new Map<string, string>();
  const achievementToUserId = new Map<string, string>();
  for (const goal of personalGoals) {
    for (const ach of goal.achievements as Achievement[]) {
      if (ach.achieved) {
        achievementToGoalTitle.set(ach.id, goal.title);
        achievementToUserId.set(ach.id, goal.user_id);
      }
    }
  }

  const activityItems: ActivityItem[] = [];

  // 今日の達成
  for (const goal of personalGoals) {
    const todayAch = (goal.achievements as Achievement[]).find(
      (a) => a.date === todayStr && a.achieved
    );
    if (todayAch) {
      activityItems.push({
        id: `ach-${todayAch.id}`,
        type: "achievement",
        actorName: memberNameMap.get(goal.user_id) ?? "?",
        content: `「${goal.title}」を達成`,
        timestamp: todayAch.created_at,
      });
    }
  }

  // リアクション
  for (const r of allReactions as Reaction[]) {
    const targetUserId = achievementToUserId.get(r.achievement_id);
    const goalTitle = achievementToGoalTitle.get(r.achievement_id);
    if (!targetUserId || !goalTitle) continue;
    const targetName = memberNameMap.get(targetUserId) ?? "?";
    const emoji = r.type === "clap" ? "👏" : r.type === "fire" ? "🔥" : "💪";
    activityItems.push({
      id: `r-${r.id}`,
      type: "reaction",
      actorName: memberNameMap.get(r.user_id) ?? "?",
      content: `${emoji} ${targetName}の「${goalTitle}」にリアクション`,
      timestamp: r.created_at,
    });
  }

  // コメント
  for (const c of allComments) {
    const targetUserId = achievementToUserId.get(c.achievement_id);
    const goalTitle = achievementToGoalTitle.get(c.achievement_id);
    if (!targetUserId || !goalTitle) continue;
    const targetName = memberNameMap.get(targetUserId) ?? "?";
    const preview = c.body.length > 15 ? c.body.slice(0, 15) + "…" : c.body;
    activityItems.push({
      id: `c-${c.id}`,
      type: "comment",
      actorName: c.display_name,
      content: `「${preview}」と${targetName}を応援`,
      timestamp: c.created_at,
    });
  }

  // 最新5件
  activityItems.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const recentActivities = activityItems.slice(0, 5);

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

      {/* ─── グループ合計スタンプ ─── */}
      {groupTotalStamps > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-4 mb-5 flex items-center gap-4 border border-orange-100">
          <div className="text-4xl">⭐</div>
          <div>
            <div className="text-2xl font-bold text-orange-500">
              {groupTotalStamps}
              <span className="text-base font-normal text-orange-400 ml-1">スタンプ</span>
            </div>
            <div className="text-xs text-gray-500">グループ全体の{displayMonth}合計</div>
          </div>
          <div className="ml-auto flex gap-2">
            {[...goalsByUser.entries()].map(([uid, d]) => (
              d.achievedToday ? (
                <span key={uid} title={memberNameMap.get(uid)} className="text-xl">
                  ✅
                </span>
              ) : null
            ))}
          </div>
        </div>
      )}

      {/* ─── マイルストーンバナー ─── */}
      <MilestoneBanner milestones={milestones} />

      {/* ─── グループチャレンジ ─── */}
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

      {/* ─── 個人目標 ─── */}
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

      {/* ─── アクティビティフィード ─── */}
      <GroupActivityFeed items={recentActivities} />
    </div>
  );
}
