-- Varumärken (ett per tidning)
create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  wp_api_url text not null default 'https://kvalitetsmagasinet.se',
  categories jsonb not null default '[]'
);

-- Tidningsnummer
create table issues (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  name text not null,
  page_count integer not null default 64,
  created_at timestamptz default now()
);

-- Sidor
create table pages (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references issues(id) on delete cascade,
  page_number integer not null,
  content_type text,
  article_wp_id integer,
  article_title text,
  article_url text,
  article_redax_id text,
  notes text,
  updated_at timestamptz default now()
);

-- Aktivera realtid
alter table pages replica identity full;
alter publication supabase_realtime add table pages;

-- Row-level security (alla inloggade användare kan läsa/skriva)
alter table brands enable row level security;
alter table issues enable row level security;
alter table pages enable row level security;

create policy "Authenticated read brands" on brands for select using (auth.role() = 'authenticated');
create policy "Authenticated read issues" on issues for all using (auth.role() = 'authenticated');
create policy "Authenticated read pages" on pages for all using (auth.role() = 'authenticated');

-- Exempeldata för KM
insert into brands (name, wp_api_url, categories) values (
  'Kvalitetsmagasinet',
  'https://kvalitetsmagasinet.se',
  '[
    {"id": "redaktionellt", "name": "Redaktionellt", "color": "#eab308"},
    {"id": "tema",          "name": "Tema",           "color": "#ec4899"},
    {"id": "annons",        "name": "Annons",          "color": "#60a5fa"},
    {"id": "cover",         "name": "Cover/IFC",       "color": "#a78bfa"},
    {"id": "fast",          "name": "Fast sida",       "color": "#94a3b8"}
  ]'
);
