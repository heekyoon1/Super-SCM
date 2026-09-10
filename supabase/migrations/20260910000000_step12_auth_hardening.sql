-- STEP 12: 서버 로그인 성공 시점의 last_login_at 기록.
create or replace function core.mark_login() returns void
language plpgsql security definer set search_path = core, public as $$
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  update core.app_user set last_login_at = now() where user_id = auth.uid();
end;
$$;

revoke all on function core.mark_login() from public;
grant execute on function core.mark_login() to authenticated;
