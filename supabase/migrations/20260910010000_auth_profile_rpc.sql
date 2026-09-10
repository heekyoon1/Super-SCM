-- `core` schema가 PostgREST Exposed schemas에 없어도 인증 판정은 public RPC로 수행한다.
-- 함수 내부의 auth.uid()가 현재 authenticated JWT를 기준으로 하므로 다른 사용자 정보를 반환하지 않는다.
create or replace function public.current_app_user()
returns table (
  user_id uuid,
  email text,
  name text,
  department text,
  role text,
  active boolean,
  last_login_at timestamptz
)
language sql
stable
security definer
set search_path = core, public
as $$
  select au.user_id, au.email, au.name, au.department, au.role, au.active, au.last_login_at
  from core.app_user au
  where au.user_id = auth.uid();
$$;

revoke all on function public.current_app_user() from public;
grant execute on function public.current_app_user() to authenticated;

create or replace function public.mark_current_login()
returns void
language plpgsql
security definer
set search_path = core, public
as $$
begin
  if auth.uid() is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  update core.app_user
  set last_login_at = now()
  where user_id = auth.uid();
end;
$$;

revoke all on function public.mark_current_login() from public;
grant execute on function public.mark_current_login() to authenticated;
