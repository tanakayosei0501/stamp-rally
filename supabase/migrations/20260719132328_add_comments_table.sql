-- comments テーブル: 達成記録へのコメント
create table if not exists comments (
  id             uuid primary key default gen_random_uuid(),
  achievement_id uuid not null references achievements(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  body           text not null check (char_length(body) > 0 and char_length(body) <= 200),
  created_at     timestamptz not null default now()
);

create index if not exists comments_achievement_id_idx on comments(achievement_id);

alter table comments enable row level security;

create policy "comments_select" on comments
  for select using (true);

create policy "comments_insert" on comments
  for insert with check (auth.uid() = user_id);

create policy "comments_delete" on comments
  for delete using (auth.uid() = user_id);
