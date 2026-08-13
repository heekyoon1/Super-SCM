# Supabase Connection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a secure, environment-driven Supabase client foundation without changing the current mock UI or adding database behavior.

**Architecture:** Use `@supabase/supabase-js` with one browser client factory and one server client factory. Both factories validate `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; no service-role key is accepted or referenced. The current page remains disconnected from Supabase until a later CRUD task.

**Tech Stack:** Next.js 15 App Router, TypeScript, React 19, `@supabase/supabase-js`, npm.

## Global Constraints

- Do not add database tables, migrations, RLS policies, Auth flows, Storage buckets, or CRUD calls.
- Use only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for this foundation.
- Never add a real Supabase secret to source control.
- Existing mock UI behavior must remain unchanged.
- Keep the existing `vercel.json` Next.js framework setting intact.

---

### Task 1: Add Supabase dependency and environment template

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.gitignore`
- Create: `.env.example`

**Interfaces:**
- Produces the dependency and environment contract consumed by Tasks 2 and 3.

- [ ] **Step 1: Add the dependency using npm**

Run:

```powershell
npm install @supabase/supabase-js
```

Expected: `package.json` and `package-lock.json` contain `@supabase/supabase-js`; no application source files change.

- [ ] **Step 2: Add the environment template**

Create `.env.example` with:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

- [ ] **Step 3: Confirm real environment files remain ignored**

Ensure `.gitignore` contains:

```gitignore
.env
.env*.local
```

- [ ] **Step 4: Verify dependency metadata**

Run:

```powershell
node -e "const p=require('./package.json'); if(!p.dependencies['@supabase/supabase-js']) process.exit(1); console.log(p.dependencies['@supabase/supabase-js'])"
git check-ignore .env.local
```

Expected: the dependency version prints and `.env.local` is ignored.

### Task 2: Implement the browser Supabase client

**Files:**
- Create: `lib/supabase/client.ts`

**Interfaces:**
- Produces `createSupabaseBrowserClient(): SupabaseClient` for future client components.
- Consumes `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

- [ ] **Step 1: Define the missing-configuration behavior test target**

The verification command will import the module with both variables unset and must observe an error containing `NEXT_PUBLIC_SUPABASE_URL`.

- [ ] **Step 2: Implement the minimal factory**

Use this behavior:

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (!key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return { url, key };
}

export function createSupabaseBrowserClient(): SupabaseClient {
  const { url, key } = getPublicSupabaseConfig();
  return createClient(url, key);
}
```

- [ ] **Step 3: Verify the module type-checks**

Run:

```powershell
npx tsc --noEmit
```

Expected: exit code 0.

### Task 3: Implement the server Supabase client

**Files:**
- Create: `lib/supabase/server.ts`

**Interfaces:**
- Produces `createSupabaseServerClient(): SupabaseClient` for future Server Components and Route Handlers.
- Consumes the same public URL and anon/publishable key contract as Task 2.

- [ ] **Step 1: Implement the server factory**

Use the same validation contract as the browser factory and call `createClient(url, key)`. Do not import or reference a service-role key, cookies, Auth, or database tables in this foundation task.

- [ ] **Step 2: Verify both factories expose the intended API**

Run:

```powershell
npx tsc --noEmit
```

Expected: exit code 0 with both modules included in the TypeScript program.

### Task 4: Document local and Vercel configuration

**Files:**
- Modify: `README.md`

**Interfaces:**
- Documents the environment contract for local development and Vercel Project Settings.

- [ ] **Step 1: Add setup instructions**

Document copying `.env.example` to `.env.local`, then filling the Supabase Project URL and publishable/anon key from Supabase Project Settings → API.

- [ ] **Step 2: Add Vercel instructions**

Document adding the same two variables to Vercel Project Settings → Environment Variables for Development, Preview, and Production as appropriate, followed by a redeploy.

- [ ] **Step 3: Add security warning**

State that service-role keys must never be placed in `NEXT_PUBLIC_*` variables, the browser bundle, `.env.example`, or Git.

### Task 5: Final verification and commit

**Files:**
- Verify: `package.json`, `package-lock.json`, `.env.example`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `.gitignore`, `README.md`

- [ ] **Step 1: Verify no real secrets are tracked**

Run:

```powershell
git status --short
git grep -n -i "service_role\|sb_secret\|eyJ" -- . ':!package-lock.json' || exit 0
```

Expected: no real secret values are found.

- [ ] **Step 2: Run type-check and production build**

Run:

```powershell
npx tsc --noEmit
npm run build
```

Expected: both commands exit 0; the existing page still builds without Supabase environment variables because no page imports the factories yet.

- [ ] **Step 3: Review the diff and commit**

Run:

```powershell
git diff --check
git add package.json package-lock.json .gitignore .env.example lib/supabase README.md
git commit -m "Add Supabase connection foundation"
```

Expected: a commit containing only the approved Supabase connection foundation.
