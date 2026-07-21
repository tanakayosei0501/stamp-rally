// =============================================
// データベースの型定義
// Supabaseのテーブル構造をTypeScriptの型として定義します
// これにより、コードを書くときに入力補完が効きます
// =============================================

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
};

export type Group = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
};

export type GroupMember = {
  group_id: string;
  user_id: string;
  joined_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  group_id: string | null;
  challenge_id: string | null;
  title: string;
  description: string | null;
  target_month: string; // 例: "2026-08"
  category: string | null;
  created_at: string;
};

export type Achievement = {
  id: string;
  goal_id: string;
  date: string; // 例: "2026-07-15"
  achieved: boolean;
  note: string | null;
  created_at: string;
};

export type Reaction = {
  id: string;
  achievement_id: string;
  user_id: string;
  type: string; // 例: "clap", "like"
  created_at: string;
};

export type Comment = {
  id: string;
  achievement_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

// 画面表示に便利な結合型
export type GoalWithAchievements = Goal & {
  achievements: Achievement[];
};

export type GroupMemberWithProfile = GroupMember & {
  profiles: Profile;
};
