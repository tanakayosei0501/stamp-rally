-- goals に challenge_id を追加（同一チャレンジのメンバーコピーを紐付ける）
alter table goals add column if not exists challenge_id uuid;

-- グループチャレンジ作成関数
-- security definer で RLS を超えて全メンバー分のゴールを一括挿入
create or replace function create_group_challenge(
  p_group_id    uuid,
  p_title       text,
  p_category    text,
  p_target_month text
) returns void language plpgsql security definer as $$
declare
  v_challenge_id uuid := gen_random_uuid();
  v_member_id    uuid;
begin
  -- 呼び出し者がグループメンバーか確認
  if not exists (
    select 1 from group_members
    where group_id = p_group_id and user_id = auth.uid()
  ) then
    raise exception 'Not a member of this group';
  end if;

  -- 全メンバー分のゴールを作成
  for v_member_id in
    select user_id from group_members where group_id = p_group_id
  loop
    insert into goals (user_id, group_id, challenge_id, title, category, target_month)
    values (v_member_id, p_group_id, v_challenge_id, p_title, p_category, p_target_month);
  end loop;
end;
$$;
