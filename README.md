# Prose Craft Aid

Prose Craft Aid is a student-facing A-Level English Literature study app for **Pearson Edexcel Component 2: Prose**. It currently supports two core user journeys:

- **Build** — guided essay planning and construction
- **Explore** — direct access to academic datasets and revision resources

This repository is the current code source of truth for the app.

## Current product status

The app is currently a **published MVP baseline** with:

- a working Essay Builder
- a working Library / Resource Hub
- secure signed-in persistence
- anonymous local-only fallback
- student-facing print / save-as-PDF support for Library pages

## Core user journeys

### 1. Build

The Builder supports structured essay preparation through:

- question selection
- thesis route selection
- paragraph card generation
- evidence selection
- save / reload plan persistence

Current Builder routes include:

- `/builder`
- `/paragraph-engine`
- `/timed`

### 2. Explore

The Library supports direct browsing of academic content without requiring essay generation.

Current Library routes include:

- `/library`
- `/library/quotes`
- `/library/questions`
- `/library/comparison`
- `/library/thesis`
- `/library/context`

Current Library sections include:

- Quotes
- Questions
- Comparison
- Thesis & Paragraph
- Context

The Quotes section currently supports:

- **By quote** view
- **By theme** grouped view
- unique entries counter in grouped mode
- expand / collapse all
- print-friendly output

## Tech stack

- **Vite**
- **React 18**
- **TypeScript**
- **React Router**
- **TanStack React Query**
- **Supabase**
- **Tailwind CSS**
- **Radix UI**
- **Vitest**

## Running locally

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build the app:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Run tests:

```bash
npm run test
```

## Environment variables

This app expects a Supabase connection via Vite environment variables.

Create a local `.env` file using the same values as your connected project:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Recommended next step: create a `.env.example` file documenting these values without secrets.

## Persistence model

The app currently uses two persistence modes:

### Anonymous user

- essay plans are saved **locally in browser storage only**
- anonymous users do **not** persist plans to the backend
- the UI should make this clear via local-only messaging

### Signed-in user

- plans are saved to **Supabase**
- signed-in saves should show an account-level confirmation

## Supabase notes

The app uses a Supabase client defined in:

- `src/integrations/supabase/client.ts`

Generated database types live in:

- `src/integrations/supabase/types.ts`

Important:

- this repository contains the app code and generated Supabase types
- it does **not** by itself guarantee that you currently have direct access to the underlying Supabase project
- some recent migration planning work was intentionally done outside live Supabase because project access was unresolved

## Current repo structure

Important application areas include:

- `src/App.tsx` — top-level routing
- `src/components/` — shared UI and app shell
- `src/pages/` — route-level screens
- `src/pages/library/` — Library pages
- `src/lib/` — content/provider logic
- `src/integrations/supabase/` — Supabase client and generated types
- `src/contexts/` — auth and related context state

## What is in scope now

Current MVP scope includes:

### Builder

- question selection
- thesis routes
- paragraph engine
- evidence panel
- save/load persistence
- local vs account persistence clarity

### Library

- Quotes
- Questions
- Comparison
- Thesis & Paragraph
- Context
- Quotes-by-Theme
- print-friendly revision output

## What is intentionally not in scope right now

The following are intentionally deferred:

- shell-wide Build / Explore IA restructure
- dashboard-heavy feature expansion
- Builder handoff from Library
- full Google Sheets workbook import
- intro/conclusion builder
- tiered writing modes
- Recent Plans UI

## Current development discipline

The project is now mature enough that uncontrolled feature creep is a real risk.

The working rule should be:

- only build features that materially help **Build** or **Explore** modes
- fix real blockers, persistence issues, or correctness defects
- avoid speculative admin/dashboard work
- avoid broad navigation refactors unless justified by repeated real use
- prefer larger, carefully designed change blocks over many small iterative prompts

## Next planned phase

The next controlled phase is:

### Tier 1 Google Sheets → Supabase migration

Purpose:

- enrich Library content
- improve Explore mode using curated external workbook data
- later strengthen Builder with higher-quality structured source data

Planned Tier 1 runtime targets:

- `library_quotes`
- `library_questions`
- `library_comparative_pairings`
- `library_thesis_bank`
- `library_paragraph_frames`
- `library_context_bank`

Important:

- this migration should be **curated and selective**
- the app should **not** use live Google Sheets as its runtime dataset layer
- Google Sheets should be treated as staging / source material, not the product database

## Repository status assessment

This repo is currently:

- **good enough to act as the primary code source of truth**
- **not yet fully hardened for handoff or long-term team maintenance**

Recommended repo hardening follow-ups:

1. add `.env.example`
2. document deployment / hosting expectations
3. document Supabase project ownership and access once confirmed
4. add migration / schema ownership notes when the next phase begins

## Live app

Current published app:

- https://prose-craft-aid.lovable.app

## Summary

Prose Craft Aid has evolved from an essay-construction concept into a dual-mode academic study platform with:

- a stable Builder workflow
- a useful Explore / Library mode
- secure persistence behaviour
- controlled scope discipline

This README is intended to make the repository understandable enough for GitHub-first development from this point onward.
