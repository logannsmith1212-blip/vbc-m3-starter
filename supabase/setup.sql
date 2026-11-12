-- Morrowlane Service Request Portal: Supabase setup
-- Paste this whole script into the Supabase SQL Editor and click Run.
-- Run it once, on an empty project. If the table already exists it stops
-- with an error instead of overwriting anything.

begin;

-- 1 + 2. The table, with checks that match the app's validation rules
create table public.requests (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),
  requester_name text not null check (btrim(requester_name) <> '' and char_length(requester_name) <= 100),
  location       text not null check (location in ('Minneapolis', 'Chicago', 'Denver', 'Austin')),
  description    text not null check (btrim(description) <> '' and char_length(description) <= 500),
  priority       text not null check (priority in ('Low', 'Medium', 'High', 'Urgent')),
  status         text not null default 'New' check (status in ('New', 'In Progress', 'Complete'))
);

-- 3. Row Level Security: on, with no policies. That means the public
-- (anon/publishable) key and logged-in users get no access at all: they
-- cannot read, add, change, or delete any row. The app connects only from
-- the server with the Supabase secret key, which bypasses RLS. Keep that
-- key out of the browser and out of Git.
alter table public.requests enable row level security;

-- 4. The 22 seed rows from data/seed-requests.csv, oldest first, ids 1-22
insert into public.requests
  (id, created_at, requester_name, location, description, priority, status)
overriding system value
values
  (1, '2026-07-16T14:20:00Z', 'Dana Whitfield', 'Minneapolis', 'HVAC making noise in suite 400', 'High', 'Complete'),
  (2, '2026-07-17T16:05:00Z', 'Marcus Ellery', 'Chicago', 'Replace lobby badge printer', 'Medium', 'Complete'),
  (3, '2026-07-20T13:38:00Z', 'Priya Raghunathan', 'Denver', 'Standing desk request — new hire starts Aug 3', 'Medium', 'Complete'),
  (4, '2026-07-22T18:47:00Z', 'Tomas Beckley', 'Austin', 'Conference room B projector will not connect to laptops', 'High', 'Complete'),
  (5, '2026-07-24T15:11:00Z', 'Alison Vo', 'Minneapolis', 'Schedule quarterly fire-safety inspection', 'Medium', 'Complete'),
  (6, '2026-07-27T21:02:00Z', 'Devon Ruiz', 'Chicago', 'Water leak under the breakroom sink, floor 6', 'Urgent', 'Complete'),
  (7, '2026-07-29T14:55:00Z', 'Hannah Sorensen', 'Denver', 'Order two ergonomic chairs for the finance team', 'Low', 'Complete'),
  (8, '2026-07-31T17:26:00Z', 'Curtis Nakamura', 'Austin', 'Badge access not working for the fourth floor stairwell', 'High', 'Complete'),
  (9, '2026-08-03T13:15:00Z', 'Renata Oyelaran', 'Minneapolis', 'Coffee machine in the north kitchen keeps shutting off', 'Low', 'Complete'),
  (10, '2026-08-04T19:40:00Z', 'Grant Pemberton', 'Chicago', 'Move six workstations from 12A to 12C before Friday', 'Medium', 'Complete'),
  (11, '2026-08-06T14:08:00Z', 'Sofia Marchetti', 'Denver', 'Elevator 2 stopped between floors, riders freed by building staff', 'Urgent', 'Complete'),
  (12, '2026-08-07T16:33:00Z', 'Isaac Fontaine', 'Austin', 'Restock the first aid cabinets on all three floors', 'Low', 'Complete'),
  (13, '2026-08-10T15:47:00Z', 'Dana Whitfield', 'Minneapolis', 'Replace burned out lights above the reception desk', 'Low', 'Complete'),
  (14, '2026-08-12T13:52:00Z', 'Marcus Ellery', 'Chicago', 'Quote needed for repainting the 8th floor corridor', 'Medium', 'In Progress'),
  (15, '2026-08-14T20:19:00Z', 'Priya Raghunathan', 'Denver', 'Server room temperature alarm went off twice overnight', 'Urgent', 'In Progress'),
  (16, '2026-08-17T14:41:00Z', 'Tomas Beckley', 'Austin', 'Set up two extra monitors in the training room', 'Medium', 'In Progress'),
  (17, '2026-08-19T18:07:00Z', 'Nadia Kowalski', 'Minneapolis', 'Loading dock door closes only halfway', 'High', 'In Progress'),
  (18, '2026-08-21T15:24:00Z', 'Curtis Nakamura', 'Austin', 'Add visitor parking signage at the south entrance', 'Low', 'In Progress'),
  (19, '2026-08-24T13:36:00Z', 'Renata Oyelaran', 'Minneapolis', 'Quarterly deep clean for the client meeting suites', 'Medium', 'In Progress'),
  (20, '2026-08-26T16:58:00Z', 'Grant Pemberton', 'Chicago', 'Front entrance card reader is slow to respond, sometimes needs three taps', 'High', 'New'),
  (21, '2026-08-27T14:12:00Z', 'Sofia Marchetti', 'Denver', 'Request a second recycling pickup each week', 'Low', 'New'),
  (22, '2026-08-28T17:45:00Z', 'Alison Vo', 'Minneapolis', 'Air conditioning in suite 220 is not cooling, staff moved to the open area', 'Urgent', 'New');

-- Make the next new request get id 23, not 1
select setval(pg_get_serial_sequence('public.requests', 'id'), (select max(id) from public.requests));

commit;

-- Quick check: should return 22 | 9 | 2 | 5
select
  count(*)                                                        as total,
  count(*) filter (where status <> 'Complete')                    as open_requests,
  count(*) filter (where status <> 'Complete' and priority = 'Urgent') as urgent_open,
  count(*) filter (where status = 'Complete'
    and date_trunc('month', created_at at time zone 'UTC') =
        (select date_trunc('month', max(created_at) at time zone 'UTC') from public.requests)) as completed_this_month
from public.requests;
