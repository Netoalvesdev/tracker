# Tracker Whatsapp — Deploy na Vercel

Este projeto é Next.js. Se a Vercel tentar rodar `react-scripts build`, o projeto vai falhar, porque `react-scripts` é de Create React App e não faz parte deste projeto.

## Configuração correta na Vercel

No projeto da Vercel, vá em:

Settings → Build and Development Settings

Use:

- Framework Preset: Next.js
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm run build`
- Output Directory: deixar vazio/padrão

Este ZIP também inclui `vercel.json` com o build correto para tentar sobrescrever a configuração antiga.

## Variáveis de ambiente

Vercel → Project → Settings → Environment Variables

Adicione:

```env
NEXT_PUBLIC_SUPABASE_URL=https://mlbruxgsmxefonjxbqhg.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua_publishable_key
SUPABASE_SECRET_KEY=sua_secret_key
```

Nunca coloque `SUPABASE_SECRET_KEY` dentro de componente React ou arquivo client-side.

Depois de salvar as variáveis, faça Redeploy.

## SQL no Supabase

Rode o SQL abaixo no Supabase → SQL Editor → New Query → Run:

```sql
create extension if not exists pgcrypto;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  webhook_secret text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_active boolean default true
);

create table if not exists webhook_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  event_type text not null,
  lead_id text,
  phone text,
  name text,
  email text,
  source text,
  campaign text,
  creative text,
  payload jsonb,
  is_test boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_webhook_events_product_id on webhook_events(product_id);
create index if not exists idx_webhook_events_event_type on webhook_events(event_type);
create index if not exists idx_webhook_events_created_at on webhook_events(created_at);
create index if not exists idx_webhook_events_phone on webhook_events(phone);
create index if not exists idx_webhook_events_lead_id on webhook_events(lead_id);
```

## Teste final

1. Crie um produto novo.
2. Confirme no Supabase se ele apareceu na tabela `products`.
3. O webhook deve usar UUID real, não `prod-...`.
4. Clique em Testar webhook.
5. Confirme no Supabase se apareceu em `webhook_events`.
6. Clique em Limpar testes e recarregue a página; o teste não pode voltar.
