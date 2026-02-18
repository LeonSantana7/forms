-- Create the table for survey responses
create table if not exists public.survey_responses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  business_type text,
  q1 jsonb, -- "Hoje você agenda seus clientes como?" (multi-seleção)
  q2 jsonb, -- "Costuma dar problema de horário?" (multi-seleção)
  q3 jsonb, -- "O que você sempre precisa saber do cliente pra marcar o horário?" (multi-seleção)
  q4 integer, -- "Você perde muito tempo respondendo mensagem só pra falar horários disponíveis?" (1-5)
  q5 text, -- "Ajudaria se o cliente pudesse agendar sozinho e receber lembrete automático?" (sim/não/talvez)
  q6 text, -- "Quando precisa remarcar ou encaixar alguém, é tranquilo ou vira bagunça?" (single choice)
  q7 jsonb, -- "Além da agenda, o que mais facilitaria seu dia a dia no salão?" (multi-seleção)
  city text,
  source text,
  user_agent text
);

-- Enable Row Level Security (RLS)
alter table public.survey_responses enable row level security;

-- Policy to allow anonymous inserts (anyone can submit a response)
create policy "Enable insert for everyone" 
on public.survey_responses 
for insert 
to anon 
with check (true);

-- Policy to allow read access only to authenticated users (admin logic handles this via service role/password check)
-- No public select policy needed as only admin should read.
