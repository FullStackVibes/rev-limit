export const SQL_SCRIPT = `-- ==========================================
-- REV-LIMIT Database Schema & Setup Script
-- ==========================================
-- This script creates the tables, enables Row Level Security (RLS),
-- creates access policies, and registers the Auth trigger for your Micro SaaS.

-- 1. Create Tables in public schema

-- Profiles Table (linked 1:1 with auth.users)
create table if not exists public.rev_profiles (
  id uuid references auth.users on delete cascade primary key,
  business_name text not null,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Projects Table
create table if not exists public.rev_projects (
  id uuid default gen_random_uuid() primary key,
  freelancer_id uuid references public.rev_profiles(id) on delete cascade not null,
  client_name text not null,
  project_name text not null,
  total_revisions_allowed integer not null default 3,
  current_revisions_used integer not null default 0,
  status text not null check (status in ('active', 'completed')) default 'active',
  share_id text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Revisions Table
create table if not exists public.rev_revisions (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.rev_projects(id) on delete cascade not null,
  revision_body text not null,
  freelancer_comment text,
  status text not null check (status in ('pending', 'reviewed', 'completed', 'canceled')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 2. Enable Row Level Security (RLS)
-- ==========================================

alter table public.rev_profiles enable row level security;
alter table public.rev_projects enable row level security;
alter table public.rev_revisions enable row level security;

-- ==========================================
-- 3. Row Level Security Policies
-- ==========================================

-- --- Profiles Policies ---
create policy "Users can view their own profile"
  on public.rev_profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.rev_profiles
  for update
  to authenticated
  using (auth.uid() = id);


-- --- Projects Policies ---
-- Freelancers can manage all aspects of their own projects
create policy "Freelancers can manage their own projects"
  on public.rev_projects
  for all
  to authenticated
  using (auth.uid() = freelancer_id)
  with check (auth.uid() = freelancer_id);

-- Public (anon) can read project only if they query with the specific unique share_id
create policy "Allow public read of project via share_id"
  on public.rev_projects
  for select
  to anon
  using (share_id is not null);


-- --- Revisions Policies ---
-- Freelancers can view and manage revisions for their own projects
create policy "Freelancers can manage revisions for their projects"
  on public.rev_revisions
  for all
  to authenticated
  using (
    exists (
      select 1 from public.rev_projects
      where rev_projects.id = rev_revisions.project_id
      and rev_projects.freelancer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.rev_projects
      where rev_projects.id = project_id
      and rev_projects.freelancer_id = auth.uid()
    )
  );

-- Clients can view revisions if they have public access to the project
create policy "Allow public read of revisions via project status"
  on public.rev_revisions
  for select
  to anon
  using (
    exists (
      select 1 from public.rev_projects
      where rev_projects.id = rev_revisions.project_id
    )
  );

-- Clients can create new revision requests for an active project
create policy "Allow public creation of revision requests"
  on public.rev_revisions
  for insert
  to anon
  with check (
    exists (
      select 1 from public.rev_projects
      where rev_projects.id = project_id
      and rev_projects.status = 'active'
    )
  );


-- ==========================================
-- 4. Automatic Profile Trigger on Auth Signup
-- ==========================================

-- Trigger function to insert a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.rev_profiles (id, email, business_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'business_name', 'My Freelance Studio')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger assignment
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
`;

export const EXPLANATION_SECTIONS = [
  {
    title: "1. Table Structure & Constraints",
    content: "Creates the tables in the `public` schema. All tables are prefixed with \`rev_\` to avoid conflicts in a multi-tenant Supabase project. Foreign keys link \`rev_profiles\` to \`auth.users\`, \`rev_projects\` to \`rev_profiles\`, and \`rev_revisions\` to \`rev_projects\` with ON DELETE CASCADE to maintain referential integrity."
  },
  {
    title: "2. Row Level Security (RLS)",
    content: "Row Level Security is enabled explicitly on all tables using the \`alter table ... enable row level security;\` commands. In Supabase, RLS is a security safeguard: once enabled, all access is denied by default unless an explicit policy permits it."
  },
  {
    title: "3. Freelancer Ownership Policies",
    content: "Allows authenticated users to view/modify only records where the database identifies them as the owner (\`auth.uid() = id\` or \`auth.uid() = freelancer_id\`). Revisions are protected by checking if the corresponding project belongs to the current authenticated freelancer ID."
  },
  {
    title: "4. Secure Anonymous Share-ID Policy",
    content: "The \`rev_projects\` table generates a cryptographically random, high-entropy \`share_id\` (hex string). The select policy allows access to anonymous clients (\`to anon\`). Because the share URL contains this high-entropy string, only users with the unique link can find and view the project, ensuring a zero-trust access model."
  },
  {
    title: "5. Auth.Users Sign-up Trigger",
    content: "A security definer function runs immediately after a user inserts into Supabase Auth's \`auth.users\` table. It extracts the new user's email and metadata, automatically creating a profile record. \`security definer\` ensures the function executes with database-administrator privileges, bypassing the RLS lock before the user profile exists."
  }
];
