-- NARU campus pilot: school community + buddy requests. Run once on a Supabase project.
-- Tables have RLS on and no policies, so clients cannot read or write them directly.
-- Every operation goes through a SECURITY DEFINER function that looks up the caller's
-- membership by auth.uid() and checks campus and role explicitly.
-- Health data from the symptom card and medicine photos is never sent here.
begin;

create table public.campus_members (
  id uuid primary key references auth.users on delete cascade,
  campus text not null,
  role text not null default 'student' check (role in ('student', 'buddy', 'operator')),
  display_name text not null default '' check (length(display_name) <= 40),
  unique (id, campus)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  campus text not null,
  author uuid not null,
  board text not null check (board in ('free', 'qna', 'review', 'buddy', 'info')),
  title text not null check (length(trim(title)) between 1 and 120),
  body text not null check (length(trim(body)) between 1 and 3000),
  locale text not null check (length(locale) <= 10),
  -- The two things a buddy is matched on: the language to speak and where the student is from.
  country text not null default '' check (length(country) <= 2),
  anonymous boolean not null default true,
  facility text check (length(facility) <= 80),
  langs text[] not null default '{}' check (cardinality(langs) <= 16),
  rating smallint check (rating between 1 and 5),
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (author, campus) references public.campus_members (id, campus) on delete cascade
);
create index posts_feed on public.posts (campus, board, created_at desc) where not hidden;

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post uuid not null references public.posts on delete cascade,
  author uuid not null references public.campus_members on delete cascade,
  body text not null check (length(trim(body)) between 1 and 1000),
  anonymous boolean not null default true,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index comments_thread on public.comments (post, created_at);

create table public.post_likes (
  post uuid references public.posts on delete cascade,
  member uuid references public.campus_members on delete cascade,
  primary key (post, member)
);

create table public.reports (
  id bigint generated always as identity primary key,
  post uuid not null references public.posts on delete cascade,
  comment uuid references public.comments on delete cascade,
  reporter uuid not null references public.campus_members on delete cascade,
  created_at timestamptz not null default now(),
  unique nulls not distinct (post, comment, reporter)
);

create table public.buddy_requests (
  id uuid primary key default gen_random_uuid(),
  campus text not null,
  student uuid not null,
  buddy uuid references public.campus_members on delete set null,
  locale text not null check (length(locale) <= 10),
  starts_at timestamptz not null,
  place text not null default '' check (length(place) <= 120),
  help text[] not null default '{}' check (help <@ array['move', 'reception', 'payment', 'pharmacy']),
  status text not null default 'requested' check (status in ('requested', 'assigned', 'accepted', 'done', 'cancelled')),
  updated_at timestamptz not null default now(),
  foreign key (student, campus) references public.campus_members (id, campus) on delete cascade
);
create unique index one_active_request on public.buddy_requests (student, starts_at) where status in ('requested', 'assigned', 'accepted');

-- A request is a notice on the buddy board, and anyone at the same school can raise a hand on it.
-- The student picks from the hands raised; the operator stays as an escalation, not as the one person
-- every request has to wait for.
create table public.buddy_offers (
  id uuid primary key default gen_random_uuid(),
  request uuid not null references public.buddy_requests on delete cascade,
  member uuid not null references public.campus_members on delete cascade,
  note text not null default '' check (length(note) <= 300),
  created_at timestamptz not null default now(),
  unique (request, member)
);
create unique index one_active_assignment on public.buddy_requests (buddy, starts_at) where status in ('assigned', 'accepted');

alter table public.campus_members enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.reports enable row level security;
alter table public.buddy_requests enable row level security;
alter table public.buddy_offers enable row level security;
revoke all on public.campus_members, public.posts, public.comments, public.post_likes, public.reports, public.buddy_requests, public.buddy_offers
  from public, anon, authenticated;

-- The caller's membership row, or an error. Used by every function below.
create function public.require_member() returns public.campus_members
language plpgsql stable security definer set search_path = '' as $$
declare actor public.campus_members;
begin
  select * into actor from public.campus_members m where m.id = auth.uid();
  if actor.id is null then raise exception 'not a campus member' using errcode = '42501'; end if;
  return actor;
end $$;

create function public.my_membership()
returns table (campus text, role text, display_name text)
language sql stable security definer set search_path = '' as $$
  select m.campus, m.role, m.display_name from public.campus_members m where m.id = auth.uid()
$$;

-- p_query: plain text searched in titles and bodies (case-insensitive).
create function public.list_posts(p_feed text, p_limit int default 50, p_query text default null)
returns table (id uuid, board text, title text, excerpt text, created_at timestamptz, likes int, comments int, locale text)
language sql stable security definer set search_path = '' as $$
  with me as (select m.campus from public.campus_members m where m.id = auth.uid()),
  feed as (
    select p.*,
      (select count(*)::int from public.post_likes l where l.post = p.id) as like_count,
      (select count(*)::int from public.comments c where c.post = p.id and not c.hidden) as comment_count
    from public.posts p join me on p.campus = me.campus
    where not p.hidden and (p_feed in ('all', 'hot') or p.board = p_feed)
      and (nullif(trim(p_query), '') is null
        or strpos(lower(p.title || ' ' || p.body), lower(trim(p_query))) > 0)
  )
  select f.id, f.board, f.title, left(f.body, 90), f.created_at, f.like_count, f.comment_count, f.locale
  from feed f
  where p_feed <> 'hot' or f.like_count >= 10
  order by case when p_feed = 'hot' then f.like_count end desc nulls last, f.created_at desc
  limit least(greatest(p_limit, 1), 100)
$$;

-- Comment authors are numbered per post in order of their first comment (익명1, 익명2 …);
-- the post's writer shows as "author". Names appear only when the writer chose not to be anonymous.
create function public.get_post(p_id uuid) returns json
language sql stable security definer set search_path = '' as $$
  with me as (select m.id, m.campus from public.campus_members m where m.id = auth.uid()),
  post as (select p.* from public.posts p join me on p.campus = me.campus where p.id = p_id and not p.hidden),
  firsts as (
    select c.author, min(c.created_at) as first_at
    from public.comments c join post on c.post = post.id
    where c.author <> post.author group by c.author
  ),
  ranks as (select f.author, row_number() over (order by f.first_at, f.author) as n from firsts f)
  select json_build_object(
    'id', post.id, 'board', post.board, 'title', post.title, 'body', post.body, 'locale', post.locale,
    'createdAt', post.created_at, 'facility', post.facility, 'langs', post.langs, 'rating', post.rating,
    'mine', post.author = me.id,
    'authorName', case when post.anonymous then null
      else (select a.display_name from public.campus_members a where a.id = post.author) end,
    'likes', (select count(*) from public.post_likes l where l.post = post.id),
    'liked', exists (select 1 from public.post_likes l where l.post = post.id and l.member = me.id),
    'thread', coalesce((
      select json_agg(json_build_object(
        'id', c.id, 'body', c.body, 'createdAt', c.created_at,
        'who', case when c.author = post.author then to_json('author'::text) else to_json(r.n) end,
        'name', case when c.anonymous then null
          else (select a.display_name from public.campus_members a where a.id = c.author) end,
        'mine', c.author = me.id
      ) order by c.created_at)
      from public.comments c left join ranks r on r.author = c.author
      where c.post = post.id and not c.hidden
    ), '[]'::json)
  )
  from post, me
$$;

create function public.create_post(
  p_board text, p_title text, p_body text, p_locale text, p_anonymous boolean,
  p_facility text default null, p_langs text[] default '{}', p_rating int default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor public.campus_members := public.require_member(); new_id uuid;
begin
  insert into public.posts (campus, author, board, title, body, locale, anonymous, facility, langs, rating)
  values (
    actor.campus, actor.id, p_board, trim(p_title), trim(p_body), p_locale, coalesce(p_anonymous, true),
    case when p_board = 'review' then nullif(trim(p_facility), '') end,
    case when p_board = 'review' then coalesce(p_langs, '{}') else '{}' end,
    case when p_board = 'review' then p_rating end
  ) returning id into new_id;
  return new_id;
end $$;

create function public.add_comment(p_post uuid, p_body text, p_anonymous boolean) returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor public.campus_members := public.require_member(); new_id uuid;
begin
  if not exists (select 1 from public.posts p where p.id = p_post and p.campus = actor.campus and not p.hidden) then
    raise exception 'post unavailable' using errcode = '42501';
  end if;
  insert into public.comments (post, author, body, anonymous)
  values (p_post, actor.id, trim(p_body), coalesce(p_anonymous, true)) returning id into new_id;
  return new_id;
end $$;

create function public.toggle_like(p_post uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare actor public.campus_members := public.require_member();
begin
  if not exists (select 1 from public.posts p where p.id = p_post and p.campus = actor.campus and not p.hidden) then
    raise exception 'post unavailable' using errcode = '42501';
  end if;
  delete from public.post_likes l where l.post = p_post and l.member = actor.id;
  if not found then insert into public.post_likes (post, member) values (p_post, actor.id); end if;
end $$;

create function public.report_content(p_post uuid, p_comment uuid default null) returns void
language plpgsql security definer set search_path = '' as $$
declare actor public.campus_members := public.require_member();
begin
  if not exists (select 1 from public.posts p where p.id = p_post and p.campus = actor.campus)
     or (p_comment is not null and not exists (select 1 from public.comments c where c.id = p_comment and c.post = p_post)) then
    raise exception 'content unavailable' using errcode = '42501';
  end if;
  insert into public.reports (post, comment, reporter) values (p_post, p_comment, actor.id) on conflict do nothing;
end $$;

-- Writers delete their own content; operators hide reported content in their campus.
create function public.delete_post(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare actor public.campus_members := public.require_member();
begin
  delete from public.posts p where p.id = p_id and p.author = actor.id;
  if not found and actor.role = 'operator' then
    update public.posts p set hidden = true where p.id = p_id and p.campus = actor.campus;
  end if;
  if not found then raise exception 'not allowed' using errcode = '42501'; end if;
end $$;

create function public.delete_comment(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare actor public.campus_members := public.require_member();
begin
  delete from public.comments c where c.id = p_id and c.author = actor.id;
  if not found and actor.role = 'operator' then
    update public.comments c set hidden = true
    where c.id = p_id and exists (select 1 from public.posts p where p.id = c.post and p.campus = actor.campus);
  end if;
  if not found then raise exception 'not allowed' using errcode = '42501'; end if;
end $$;

create function public.moderation_queue()
returns table (post uuid, comment uuid, reports int, title text, body text)
language sql stable security definer set search_path = '' as $$
  select r.post, r.comment, count(*)::int, p.title, coalesce(c.body, p.body)
  from public.reports r
  join public.posts p on p.id = r.post
  left join public.comments c on c.id = r.comment
  join public.campus_members op on op.id = auth.uid() and op.role = 'operator' and op.campus = p.campus
  where not p.hidden and (c.id is null or not c.hidden)
  group by r.post, r.comment, p.title, c.body, p.body
  order by count(*) desc
$$;

-- On a database created before the country column: drop the four-argument overload first, or both will
-- exist and PostgREST will not know which one the app means.
--   drop function if exists public.request_buddy(timestamptz, text, text[], text);
create function public.request_buddy(p_starts_at timestamptz, p_place text, p_help text[], p_locale text, p_country text default '') returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor public.campus_members := public.require_member(); new_id uuid;
begin
  if p_starts_at <= now() then raise exception 'time must be in the future' using errcode = '22023'; end if;
  insert into public.buddy_requests (campus, student, locale, country, starts_at, place, help)
  values (actor.campus, actor.id, p_locale, upper(coalesce(p_country, '')), p_starts_at, trim(coalesce(p_place, '')), coalesce(p_help, '{}'))
  returning id into new_id;
  return new_id;
end $$;

-- Students see their own requests, buddies the ones assigned to them, operators all in their campus.
create function public.list_buddy_requests() returns json
language sql stable security definer set search_path = '' as $$
  with me as (select m.id, m.campus, m.role from public.campus_members m where m.id = auth.uid())
  select coalesce(json_agg(json_build_object(
    'id', r.id, 'startsAt', r.starts_at, 'place', r.place, 'help', r.help, 'locale', r.locale, 'country', r.country,
    'status', r.status, 'mine', r.student = me.id, 'assignedToMe', r.buddy = me.id,
    'buddyName', (select b.display_name from public.campus_members b where b.id = r.buddy),
    'offers', coalesce((
      select json_agg(json_build_object(
        'member', o.member, 'note', o.note, 'createdAt', o.created_at,
        'name', (select n.display_name from public.campus_members n where n.id = o.member)
      ) order by o.created_at)
      from public.buddy_offers o where o.request = r.id and r.student = me.id
    ), '[]'::json)
  ) order by r.starts_at desc), '[]'::json)
  from public.buddy_requests r join me on r.campus = me.campus
  where r.student = me.id or r.buddy = me.id or me.role = 'operator'
$$;

create function public.change_buddy(request_id uuid, action text, assignee uuid default null) returns void
language plpgsql security definer set search_path = '' as $$
declare actor public.campus_members := public.require_member(); req public.buddy_requests;
begin
  select * into req from public.buddy_requests r where r.id = request_id and r.campus = actor.campus for update;
  if req.id is null then raise exception 'unavailable' using errcode = '42501'; end if;
  if action = 'cancel' and (actor.id = req.student or actor.role = 'operator') and req.status in ('requested', 'assigned', 'accepted') then
    update public.buddy_requests set status = 'cancelled', buddy = null, updated_at = now() where id = req.id;
  elsif action = 'assign' and actor.role = 'operator' and req.status = 'requested' and req.starts_at > now()
    and assignee <> req.student
    and exists (select 1 from public.campus_members b where b.id = assignee and b.campus = req.campus and b.role = 'buddy') then
    update public.buddy_requests set status = 'assigned', buddy = assignee, updated_at = now() where id = req.id;
  elsif action = 'accept' and actor.id = req.buddy and req.status = 'assigned' and req.starts_at > now() then
    update public.buddy_requests set status = 'accepted', updated_at = now() where id = req.id;
  elsif action = 'decline' and actor.id = req.buddy and req.status = 'assigned' then
    update public.buddy_requests set status = 'requested', buddy = null, updated_at = now() where id = req.id;
  elsif action = 'finish' and actor.id in (req.buddy, req.student) and req.status = 'accepted' then
    update public.buddy_requests set status = 'done', updated_at = now() where id = req.id;
  else
    raise exception 'not allowed' using errcode = '42501';
  end if;
end $$;

-- The board as everyone else sees it: the day, not the hour, and no clinic name. A date and a district
-- do not say where one student will be at one hour; the exact time and place belong in the conversation
-- that starts once a buddy is picked.
create function public.open_buddy_requests() returns json
language sql stable security definer set search_path = '' as $$
  with me as (select m.id, m.campus from public.campus_members m where m.id = auth.uid())
  select coalesce(json_agg(json_build_object(
    'id', r.id, 'day', (r.starts_at at time zone 'Asia/Seoul')::date, 'help', r.help,
    'locale', r.locale, 'country', r.country, 'mine', r.student = me.id,
    'offers', (select count(*) from public.buddy_offers o where o.request = r.id),
    'offered', exists (select 1 from public.buddy_offers o where o.request = r.id and o.member = me.id)
  ) order by r.starts_at), '[]'::json)
  from public.buddy_requests r join me on r.campus = me.campus
  where r.status = 'requested' and r.starts_at > now()
$$;

create function public.offer_buddy(p_request uuid, p_note text default '') returns void
language plpgsql security definer set search_path = '' as $$
declare actor public.campus_members := public.require_member(); req public.buddy_requests;
begin
  select * into req from public.buddy_requests r
  where r.id = p_request and r.campus = actor.campus and r.status = 'requested' and r.starts_at > now();
  if req.id is null or req.student = actor.id then raise exception 'unavailable' using errcode = '42501'; end if;
  insert into public.buddy_offers (request, member, note)
  values (p_request, actor.id, left(trim(coalesce(p_note, '')), 300))
  on conflict (request, member) do update set note = excluded.note;
end $$;

create function public.withdraw_offer(p_request uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare actor public.campus_members := public.require_member();
begin
  delete from public.buddy_offers o where o.request = p_request and o.member = actor.id;
end $$;

-- The student picks, so the match does not wait for staff. One active assignment per buddy and per
-- student is still enforced by the indexes above.
create function public.pick_buddy(p_request uuid, p_member uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare actor public.campus_members := public.require_member(); req public.buddy_requests;
begin
  select * into req from public.buddy_requests r where r.id = p_request and r.campus = actor.campus for update;
  if req.id is null or req.student <> actor.id or req.status <> 'requested' or req.starts_at <= now() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not exists (select 1 from public.buddy_offers o where o.request = p_request and o.member = p_member) then
    raise exception 'no such offer' using errcode = '42501';
  end if;
  update public.buddy_requests set status = 'accepted', buddy = p_member, updated_at = now() where id = req.id;
end $$;

create function public.available_buddies() returns table (id uuid, name text)
language sql stable security definer set search_path = '' as $$
  select b.id, b.display_name from public.campus_members b
  join public.campus_members op on op.campus = b.campus and op.id = auth.uid() and op.role = 'operator'
  where b.role = 'buddy' order by b.display_name
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'require_member()', 'my_membership()', 'list_posts(text,int,text)', 'get_post(uuid)',
    'create_post(text,text,text,text,boolean,text,text[],int)', 'add_comment(uuid,text,boolean)',
    'toggle_like(uuid)', 'report_content(uuid,uuid)', 'delete_post(uuid)', 'delete_comment(uuid)',
    'moderation_queue()', 'request_buddy(timestamptz,text,text[],text,text)', 'list_buddy_requests()',
    'change_buddy(uuid,text,uuid)', 'available_buddies()',
    'open_buddy_requests()', 'offer_buddy(uuid,text)', 'withdraw_offer(uuid)', 'pick_buddy(uuid,uuid)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

commit;
