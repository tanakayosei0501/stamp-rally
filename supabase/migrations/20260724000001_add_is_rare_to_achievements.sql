-- STEP B: レアスタンプのフラグを achievements テーブルに追加
alter table achievements
  add column if not exists is_rare boolean not null default false;
