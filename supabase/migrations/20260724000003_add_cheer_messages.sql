-- STEP C: 応援メッセージ（エール）テーブル
create table if not exists cheer_messages (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id   uuid not null references auth.users(id) on delete cascade,
  group_id     uuid not null references groups(id) on delete cascade,
  message      text not null check (char_length(message) between 1 and 100),
  sent_at      timestamptz not null default now()
);

alter table cheer_messages enable row level security;

-- 同じグループのメンバーなら送信可能
create policy "cheer_insert" on cheer_messages
  for insert with check (
    auth.uid() = from_user_id
    and auth.uid() in (
      select user_id from group_members where group_id = cheer_messages.group_id
    )
  );

-- 同じグループのメンバーなら閲覧可能
create policy "cheer_select" on cheer_messages
  for select using (
    auth.uid() in (
      select user_id from group_members where group_id = cheer_messages.group_id
    )
  );
