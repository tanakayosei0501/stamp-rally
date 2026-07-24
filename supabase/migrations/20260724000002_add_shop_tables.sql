-- STEP D: スタンプ交換ショップ

-- 購入済みアイテムを管理するテーブル
create table if not exists user_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('stamp', 'character')),
  item_id text not null,
  cost int not null default 0,
  purchased_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);

alter table user_items enable row level security;

create policy "user_items_select_own" on user_items
  for select using (auth.uid() = user_id);

create policy "user_items_insert_own" on user_items
  for insert with check (auth.uid() = user_id);

-- プロフィールに「現在使用中のスタンプ/キャラクター」を追加
alter table profiles
  add column if not exists active_stamp text not null default 'default',
  add column if not exists active_character text not null default 'plant';
