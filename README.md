# Montessori Studio

A standalone Montessori learning app built with Next.js, React Three Fiber, and Supabase.

## Stack
- Next.js (App Router) + TypeScript
- three.js + @react-three/fiber + @react-three/drei
- framer-motion
- react-draggable
- zustand
- howler.js
- supabase-js

## Getting Started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Supabase Setup

1) Create a Supabase project.
2) Add a `materials` table:

```sql
create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  model_url text,
  created_at timestamp with time zone default now()
);
```

3) Add env vars to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Audio

A soft chime is included at `public/audio/chime.wav`. Replace it with your own file if desired.

## Asset Workflow (High-Res + Web)

Use this to keep print-quality originals untouched while shipping faster web assets.

1) Initialize master originals once from current web assets:

```bash
npm run assets:master:init
```

2) From now on, edit/replace your high-res files in:

```bash
assets_master/
```

3) Generate optimized web copies into:

```bash
public/assets/
```

```bash
npm run assets:optimize
```

Optional:

- `npm run assets:optimize -- --dry-run` (preview changes only)
- `npm run assets:optimize -- --scope language_arts/consonant_blend` (process one subfolder)
- `ASSET_MAX_DIM=1800 ASSET_QUALITY=82 npm run assets:optimize` (tune output size/quality)

## Deploy

Deploy with Vercel and add the same Supabase env vars in the Vercel project settings.
