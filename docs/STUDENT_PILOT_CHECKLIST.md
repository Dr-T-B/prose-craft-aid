# Student Pilot Checklist

Walk through this protocol with a real test student account on the production
URL before opening the app to a cohort.

## 1. Account setup
- [ ] Sign up with an email + password.
- [ ] Confirm a new row appears in `public.profiles` with `user_id` matching
      the new `auth.users` row.
- [ ] Confirm the welcome / dashboard route loads without a 404 or RLS error.

## 2. Navigation smoke test
Visit each route and confirm it renders:
- [ ] `/` (Dashboard)
- [ ] `/builder`
- [ ] `/build` redirects to `/builder`
- [ ] `/paragraph-builder`
- [ ] `/paragraph-engine`
- [ ] `/timed`
- [ ] `/toolkit`
- [ ] `/library`
- [ ] `/library/quotes`
- [ ] `/library/questions`

## 3. Content access
- [ ] `quote_methods` returns rows in the relevant component.
- [ ] `routes` and `questions` populate the route picker.
- [ ] `quote_pairs` populate where used.
- [ ] Library tables return content (quotes, questions, pairings, theses,
      paragraph frames, context bank).

## 4. Write operations
- [ ] Submit a paragraph attempt — confirm a row in `paragraph_attempts`
      with `student_id` matching `auth.uid()`.
- [ ] Link the attempt to a quote pair — confirm a row in
      `paragraph_attempt_quote_links`.
- [ ] Trigger a mastery update — confirm a row in
      `student_quote_pair_mastery`.

## 5. Retrieval
- [ ] Start a retrieval session — confirm a row in `retrieval_sessions`.
- [ ] Answer items — confirm rows in `retrieval_responses`.
- [ ] Confirm `retrieval_items` returns only items belonging to the user.

## 6. Recommendations
- [ ] Call `get_next_best_action(target_student_id => auth.uid())` via RPC
      from the client; expect a single recommendation row.
- [ ] Call with a different `target_student_id`; expect a `forbidden` error
      (errcode `42501`).
- [ ] Call while signed-out; expect `not_authenticated` (errcode `28000`).

## 7. Security — anon must not write
Open a private window (no session) and try each:
- [ ] `INSERT` into `timed_sessions` via the client → 403 / RLS denial.
- [ ] `INSERT` into `saved_essay_plans` → 403 / RLS denial.
- [ ] `INSERT` into `reflection_entries` → 403 / RLS denial.
- [ ] `INSERT` into `retrieval_sessions` → 403 / RLS denial.
- [ ] Public read access still works for content tables (quotes, questions).

## 8. Empty / loading / error states
For each component, confirm a helpful state when the underlying data is empty:
- [ ] `RetrievalDrill` — guidance when no retrieval items exist for the user.
- [ ] `ParagraphBuilderPage` — CTA when no quote pairs are assigned.
- [ ] `EssayBuilder` — guidance when no essay plans are saved.
- [ ] `TimedWrite` / `TimedPractice` — readable state when no plan is active.
- [ ] Library pages — empty state if a filter returns no rows.

## 9. Sign-out and re-sign-in
- [ ] After sign-out, protected routes redirect to `/auth`.
- [ ] After sign-in again, prior data is visible (paragraph attempts,
      retrieval history).

## 10. Browser console
- [ ] No uncaught exceptions during the full flow.
- [ ] No 5xx requests in the network tab.
- [ ] `auth.uid()` cookie / token is present and refreshes cleanly.
