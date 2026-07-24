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
import GroupBadges from "@/components/groups/GroupBadges";
import CheerButton from "@/components/groups/CheerButton";
import type { Achievement, Reaction, Comment } from "@/types/database";
import type { BadgeInfo, MvpInfo } from "@/components/groups/GroupBadges";
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

  // ─── STEP C: 今日のエールメッセージ ───
  type CheerMsg = { id: string; from_user_id: string; to_user_id: string; message: string; from_name: string };
  const { data: rawCheers } = isCurrentMonth
    ? await supabase
        .from("cheer_messages")
        .select("id, from_user_id, to_user_id, message")
        .eq("group_id", groupId)
        .gte("sent_at", `${todayStr}T00:00:00+09:00`)
        .lt("sent_at",  `${todayStr}T23:59:59+09:00`)
    : { data: [] };

  const todayCheers: CheerMsg[] = (rawCheers ?? []).map((c) => ({
    id: c.id,
    from_user_id: c.from_user_id,
    to_user_id: c.to_user_id,
    message: c.message,
    from_name: memberNameMap.get(c.from_user_id) ?? "?",
  }));
  // 自分が受け取ったエール
  const myCheers = todayCheers.filter((c) => c.to_user_id === user.id);

  // ─── STEP A: MVP・バッジ ───
  const stampRanking = [...goalsByUser.entries()]
    .map(([uid, d]) => ({ uid, name: memberNameMap.get(uid) ?? "?", stamps: d.stamps }))
    .sort((a, b) => b.stamps - a.stamps);

  const mvp: MvpInfo | null =
    stampRanking.length > 0 && stampRanking[0].stamps > 0
      ? { name: stampRanking[0].name, stamps: stampRanking[0].stamps, isMe: stampRanking[0].uid === user.id }
      : null;

  const badges: BadgeInfo[] = [];

  // ⭐ スタンプ王（複数メンバーがいて最多の人）
  if (mvp && memberIds.length > 1) {
    badges.push({ icon: "⭐", label: "スタンプ王", holder: mvp.name, color: "bg-yellow-100 text-yellow-800" });
  }

  // 🔥 連続の鬼（最長ストリーク 7日以上）
  const topStreak = milestones[0];
  if (topStreak?.streak >= 7) {
    badges.push({ icon: "🔥", label: `${topStreak.streak}日連続達成`, holder: topStreak.name, color: "bg-orange-100 text-orange-800" });
  }

  // 👏 応援上手（リアクション＋コメント合計 3件以上の最多者）
  const cheerCount = new Map<string, number>();
  for (const r of allReactions as Reaction[]) {
    cheerCount.set(r.user_id, (cheerCount.get(r.user_id) ?? 0) + 1);
  }
  for (const c of allComments) {
    cheerCount.set(c.user_id, (cheerCount.get(c.user_id) ?? 0) + 1);
  }
  const topCheer = [...cheerCount.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topCheer && topCheer[1] >= 3) {
    badges.push({
      icon: "👏",
      label: `応援上手（${topCheer[1]}回）`,
      holder: memberNameMap.get(topCheer[0]) ?? "?",
      color: "bg-blue-100 text-blue-800",
    });
  }

  // 🏆 皆勤賞（全目標を今日まで毎日達成, 5日以上経過）
  if (isCurrentMonth) {
    const elapsedDay = parseInt(todayStr.split("-")[2]);
    if (elapsedDay >= 5) {
      for (const [uid, data] of goalsByUser) {
        if (data.goals.length === 0) continue;
        const totalPossible = data.goals.length * elapsedDay;
        if (data.stamps >= totalPossible) {
          badges.push({ icon: "🏆", label: "皆勤賞", holder: memberNameMap.get(uid) ?? "?", color: "bg-purple-100 text-purple-800" });
          break;
        }
      }
    }
  }

  // 💎 レアハンター（レアスタンプ保有者）
  const rareHolders: string[] = [];
  for (const goal of personalGoals) {
    for (const ach of goal.achievements as Achievement[]) {
      if (ach.achieved && ach.is_rare) {
        const name = memberNameMap.get(goal.user_id);
        if (name && !rareHolders.includes(name)) rareHolders.push(name);
      }
    }
  }
  if (rareHolders.length > 0) {
    badges.push({ icon: "💎", label: "レアハンター", holder: rareHolders.join("・"), color: "bg-pink-100 text-pink-800" });
  }

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

      {/* ─── MVP・バッジ ─── */}
      <GroupBadges mvp={mvp} badges={badges} />

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

      {/* ─── 自分へのエール ─── */}
      {myCheers.length > 0 && (
        <div className="mb-5 space-y-2">
          {myCheers.map((c) => (
            <div key={c.id} className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-start gap-2">
              <span className="text-lg mt-0.5">✉️</span>
              <div>
                <span className="text-xs font-bold text-blue-600">{c.from_name}</span>
                <span className="text-xs text-gray-600"> から「{c.message}」</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── 個人目標 ─── */}
      <div>
        <h2 className="font-bold text-gray-700 mb-3 px-1">📋 個人目標</h2>
        {sortedMembers.map((gm) => {
          const displayName = profileOf(gm);
          const isMe = gm.user_id === user.id;
          const data = goalsByUser.get(gm.user_id) ?? { goals: [], stamps: 0, achievedToday: false };

          return (
            <div key={gm.user_id}>
              {/* エール送るボタン（非メンバーで今日未達成の場合） */}
              {!isMe && !data.achievedToday && isCurrentMonth && (
                <div className="flex justify-end mb-1 pr-1">
                  <CheerButton
                    toUserId={gm.user_id}
                    toName={displayName}
                    groupId={groupId}
                  />
                </div>
              )}
              <MemberGoalsSection
                userId={gm.user_id}
                displayName={displayName}
                isMe={isMe}
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
            </div>
          );
        })}
      </div>

      {/* ─── アクティビティフィード ─── */}
      <GroupActivityFeed items={recentActivities} />
    </div>
  );
}
