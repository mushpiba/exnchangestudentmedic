-- Run once on a Supabase project. Provision members after school verification.
begin;
create table public.campus_members (
  id uuid primary key references auth.users on delete cascade,
  campus text not null,
  role text not null default 'student' check (role in ('student','buddy','operator')),
  unique (id,campus)
);
create table public.campus_posts (
  id uuid primary key default gen_random_uuid(),
  campus text not null, author uuid not null, body text not null check (length(trim(body)) between 1 and 1500),
  locale text not null, hidden boolean not null default false, created_at timestamptz not null default now(),
  foreign key(author,campus) references public.campus_members(id,campus) on delete cascade
);
create table public.post_reports (
  post uuid references public.campus_posts on delete cascade, reporter uuid references public.campus_members on delete cascade,
  created_at timestamptz not null default now(), primary key(post,reporter)
);
create table public.buddy_requests (
  id uuid primary key default gen_random_uuid(), campus text not null, student uuid not null,
  buddy uuid references public.campus_members on delete set null, locale text not null, starts_at timestamptz not null,
  status text not null default 'requested' check (status in ('requested','assigned','accepted','done','cancelled')),
  foreign key(student,campus) references public.campus_members(id,campus) on delete cascade
);
create unique index one_active_request on public.buddy_requests(student,starts_at) where status in ('requested','assigned','accepted');
create unique index one_active_assignment on public.buddy_requests(buddy,starts_at) where status in ('assigned','accepted');
alter table public.campus_members enable row level security;
alter table public.campus_posts enable row level security;
alter table public.post_reports enable row level security;
alter table public.buddy_requests enable row level security;
revoke all on public.campus_members, public.campus_posts, public.post_reports, public.buddy_requests from anon, authenticated;
grant select on public.campus_members, public.campus_posts, public.buddy_requests to authenticated;
grant insert(author,campus,body,locale) on public.campus_posts to authenticated;
grant delete on public.campus_posts to authenticated;
grant insert(post,reporter) on public.post_reports to authenticated;
grant insert(student,campus,locale,starts_at) on public.buddy_requests to authenticated;
create policy own_membership on public.campus_members for select to authenticated using(id=auth.uid());
create policy same_school_posts on public.campus_posts for select to authenticated using(not hidden and campus in (select campus from public.campus_members));
create policy write_school_post on public.campus_posts for insert to authenticated with check(author=auth.uid() and campus in (select campus from public.campus_members));
create policy remove_own_post on public.campus_posts for delete to authenticated using(author=auth.uid());
create policy flag_visible_post on public.post_reports for insert to authenticated with check(reporter=auth.uid() and post in (select id from public.campus_posts));
create policy make_request on public.buddy_requests for insert to authenticated with check(student=auth.uid() and campus in (select campus from public.campus_members) and starts_at>now());
create policy read_request on public.buddy_requests for select to authenticated using(campus in (select campus from public.campus_members) and (student=auth.uid() or buddy=auth.uid() or exists(select 1 from public.campus_members where role='operator')));

-- State changes lock the request and check the actor, campus and current state.
create function public.change_buddy(request_id uuid, action text, assignee uuid default null)
returns void language plpgsql security definer set search_path='' as $$
declare req public.buddy_requests; actor public.campus_members;
begin
 select * into actor from public.campus_members where id=auth.uid();
 select * into req from public.buddy_requests where id=request_id for update;
 if actor.id is null or req.id is null or actor.campus<>req.campus then raise exception 'Unavailable'; end if;
 if action='cancel' and (actor.id=req.student or actor.role='operator') and req.status in ('requested','assigned','accepted') then
   update public.buddy_requests set status='cancelled',buddy=null where id=req.id;
 elsif action='assign' and actor.role='operator' and req.status='requested' and req.starts_at>now() and assignee<>req.student and exists(select 1 from public.campus_members where id=assignee and campus=req.campus and role='buddy') then
   update public.buddy_requests set status='assigned',buddy=assignee where id=req.id;
 elsif action='accept' and actor.id=req.buddy and req.status='assigned' and req.starts_at>now() then
   update public.buddy_requests set status='accepted' where id=req.id;
 elsif action='decline' and actor.id=req.buddy and req.status='assigned' then
   update public.buddy_requests set status='requested',buddy=null where id=req.id;
 elsif action='finish' and actor.id in (req.buddy,req.student) and req.status='accepted' then
   update public.buddy_requests set status='done' where id=req.id;
 else raise exception 'Unavailable';
 end if;
end $$;
revoke all on function public.change_buddy(uuid,text,uuid) from public,anon;
grant execute on function public.change_buddy(uuid,text,uuid) to authenticated;
create function public.available_buddies()
returns table(id uuid) language sql stable security definer set search_path='' as $$
 select b.id from public.campus_members b join public.campus_members op on op.campus=b.campus
 where op.id=auth.uid() and op.role='operator' and b.role='buddy'
$$;
revoke all on function public.available_buddies() from public,anon;
grant execute on function public.available_buddies() to authenticated;
create function public.moderate_reported_post(target uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.campus_members op join public.campus_posts p on op.campus=p.campus
 where op.id=auth.uid() and op.role='operator' and p.id=target and exists(select 1 from public.post_reports r where r.post=p.id)) then raise exception 'Unavailable'; end if;
 update public.campus_posts set hidden=true where id=target;
end $$;
revoke all on function public.moderate_reported_post(uuid) from public,anon;
grant execute on function public.moderate_reported_post(uuid) to authenticated;
grant select(post) on public.post_reports to authenticated;
create policy read_flags on public.post_reports for select to authenticated using(exists(select 1 from public.campus_members op join public.campus_posts p on op.campus=p.campus where op.id=auth.uid() and op.role='operator' and p.id=post));
commit;

