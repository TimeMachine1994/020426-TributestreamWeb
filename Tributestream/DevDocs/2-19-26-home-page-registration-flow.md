# 2-19-26 Home Page + Public Memorial Registration Flow

## Summary

Build a public home page with "Create Memorial" and "Search Memorials" actions, a `/register/loved-one` registration page that creates a user account + memorial + auto-logs in + redirects to calculator, and rename `username` → `email` as the primary login identifier site-wide.

---

## Old Site Reference

The old site (`OldSite/src/routes/+page.svelte`) had a hero section with two input clusters:
- **Create Memorial**: input for loved one's name + button → `/register/loved-one?name=<name>`
- **Search Memorials**: input for search query + button → `/search?q=<query>`

The `/register/loved-one` page collected: Loved One's Name (pre-filled), Your Name, Email, Phone. Server-side it:
1. Generated a random password
2. Created a Firebase Auth user
3. Created a memorial in Firestore
4. Sent a welcome email with login credentials
5. Auto-logged the user in via custom token
6. Redirected to `/auth/session` which forwarded to the memorial/calculator

## New Site Adaptation

Our stack uses Lucia-style sessions, argon2 hashing, Turso/Drizzle. No Firebase. The same flow applies but maps to our auth system.

---

## Implementation Steps

### Step 1 — DB Schema Changes

**File:** `src/lib/server/db/schema.ts`

- Rename `username` column → `email` (make it `notNull`, remove separate `email` column)
- Add `displayName: text('display_name')` (nullable)
- Add `phone: text('phone')` (nullable)
- Generate + push migration

### Step 2 — Rename `username` → `email` Throughout Auth System

Every file referencing `username` must be updated. Full list:

| File | Change |
|------|--------|
| `src/lib/server/db/schema.ts` | Column rename |
| `src/lib/server/auth.ts` | `validateSessionToken` select field |
| `src/lib/server/db/seed.ts` | Seed data uses email as identifier |
| `src/routes/(public)/login/+page.server.ts` | Form field + query |
| `src/routes/(public)/login/+page.svelte` | Label + input name |
| `src/routes/(public)/register/[role]/+page.server.ts` | Form field + insert |
| `src/routes/(public)/register/[role]/+page.svelte` | Label + input name |
| `src/routes/(protected)/+layout.svelte` | Display `data.user.email` instead of `data.user.username` |
| `src/routes/(protected)/admin/+page.svelte` | Welcome message |
| `src/routes/(protected)/admin/users/+page.svelte` | Table header |
| `src/routes/(protected)/admin/memorials/+page.server.ts` | Videographer select |
| `src/routes/(protected)/admin/memorials/[id]/+page.server.ts` | Videographer select |
| `src/routes/(protected)/admin/memorials/[id]/+page.svelte` | Videographer dropdown display |
| `src/routes/(protected)/admin/memorials/new/+page.server.ts` | Videographer select |
| `src/routes/(protected)/admin/memorials/new/+page.svelte` | Videographer dropdown display |
| `src/routes/(protected)/dashboard/+page.svelte` | Welcome message |
| `src/routes/api/devices/create-token/+server.ts` | Log message |
| `src/routes/demo/lucia/login/+page.server.ts` | Form fields + validation |
| `src/routes/demo/lucia/login/+page.svelte` | Labels |
| `src/routes/demo/lucia/+page.svelte` | Display |
| `src/lib/livekit/token.ts` | Parameter name in `createSwitcherToken` (userName is fine, it's a display name) |

### Step 3 — Home Page Hero

**File:** `src/routes/(public)/+page.svelte` (rewrite)

Two side-by-side input clusters:
- **Create Memorial**: text input for loved one's name + "Create Memorial" button → `/register/loved-one?name=<encoded>`
- **Search Memorials**: text input + "Search" button → `/search?q=<encoded>`

Modern Tailwind design. Accessible. Mobile-responsive.

### Step 4 — Registration Page (`/register/loved-one`)

**New files:**
- `src/routes/(public)/register/loved-one/+page.svelte`
- `src/routes/(public)/register/loved-one/+page.server.ts`

**UI fields:** Loved One's Name (pre-filled from `?name=` URL param), Your Name, Email, Phone

**Server action flow:**
1. Parse + validate form data (lovedOneName, name, email, phone required except phone optional)
2. Check email doesn't already exist in DB
3. Generate random 12-char password
4. Hash with argon2
5. Create user: `{ email, displayName: name, phone, passwordHash, role: 'family_member' }`
6. Create memorial: `{ lovedOneName, slug, title, ownerId, familyContactName, familyContactEmail, familyContactPhone, status: 'draft' }`
7. Send welcome email (stub — logs to console)
8. Create session + set cookie (auto-login)
9. Redirect to `/schedule/<memorialId>` (calculator)

### Step 5 — Stub Email Service

**New file:** `src/lib/server/email.ts`

```typescript
export async function sendRegistrationEmail(params: {
  email: string;
  displayName: string;
  password: string;
  lovedOneName: string;
  memorialUrl: string;
}) {
  // TODO: Replace with Resend/SendGrid
  console.log(`📧 [EMAIL STUB] Registration email for ${params.email}:`);
  console.log(`   Name: ${params.displayName}`);
  console.log(`   Password: ${params.password}`);
  console.log(`   Memorial: ${params.lovedOneName}`);
  console.log(`   URL: ${params.memorialUrl}`);
}
```

### Step 6 — Search Page

**New files:**
- `src/routes/(public)/search/+page.server.ts` — load all public memorials
- `src/routes/(public)/search/+page.svelte` — search input + client-side filtering + result cards

### Step 7 — Update Public Layout Nav

**File:** `src/routes/(public)/+layout.svelte`

Add "Create Memorial" link alongside existing "Login" link.

---

## Files Changed/Created Summary

| Action | Path |
|--------|------|
| Modify | `src/lib/server/db/schema.ts` |
| Modify | `src/lib/server/auth.ts` |
| Modify | `src/lib/server/db/seed.ts` |
| Modify | `src/routes/(public)/+page.svelte` |
| Modify | `src/routes/(public)/+layout.svelte` |
| Modify | `src/routes/(public)/login/+page.server.ts` |
| Modify | `src/routes/(public)/login/+page.svelte` |
| Modify | `src/routes/(public)/register/[role]/+page.server.ts` |
| Modify | `src/routes/(public)/register/[role]/+page.svelte` |
| Modify | `src/routes/(protected)/+layout.svelte` |
| Modify | `src/routes/(protected)/admin/+page.svelte` |
| Modify | `src/routes/(protected)/admin/users/+page.svelte` |
| Modify | `src/routes/(protected)/admin/memorials/+page.server.ts` |
| Modify | `src/routes/(protected)/admin/memorials/[id]/+page.server.ts` |
| Modify | `src/routes/(protected)/admin/memorials/[id]/+page.svelte` |
| Modify | `src/routes/(protected)/admin/memorials/new/+page.server.ts` |
| Modify | `src/routes/(protected)/admin/memorials/new/+page.svelte` |
| Modify | `src/routes/(protected)/dashboard/+page.svelte` |
| Modify | `src/routes/api/devices/create-token/+server.ts` |
| Modify | `src/routes/demo/lucia/login/+page.server.ts` |
| Modify | `src/routes/demo/lucia/login/+page.svelte` |
| Modify | `src/routes/demo/lucia/+page.svelte` |
| Create | `src/routes/(public)/register/loved-one/+page.svelte` |
| Create | `src/routes/(public)/register/loved-one/+page.server.ts` |
| Create | `src/routes/(public)/search/+page.server.ts` |
| Create | `src/routes/(public)/search/+page.svelte` |
| Create | `src/lib/server/email.ts` |
| Generate | Drizzle migration |

## Key Decisions

- **Role for home page registrants:** `family_member` (existing role, kept as-is)
- **Login identifier:** Email replaces username site-wide
- **Password:** Auto-generated, never user-chosen. Sent via email.
- **Email service:** Stubbed (console.log) for now. Resend integration later.
- **Search:** Server-loaded, client-filtered (matches old site approach)
- **Existing `/register/[role]` routes:** Kept for admin/internal use, updated to use email
