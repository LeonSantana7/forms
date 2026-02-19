-- Create the table for survey responses
create table if not exists public.survey_responses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  business_type text,
  q1 jsonb, 
  q2 jsonb, 
  q3 jsonb, 
  q4 integer, 
  q5 text, 
  q6 text, 
  q7 jsonb, 
  city text,
  source text,
  user_agent text,
  ip text -- Added for rate limiting
);

-- Enable Row Level Security (RLS)
alter table public.survey_responses enable row level security;

-- Policy to allow anonymous inserts
create policy "Enable insert for everyone" 
on public.survey_responses 
for insert 
to anon
with check (true);

-- No select policy for anon. Admin uses service role key in API.
