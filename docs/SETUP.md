# Environment setup

## Supabase project

| | |
|---|---|
| Project | `run-the-floor` (ref `pshvhvidywzstqwrjvdp`), ap-southeast-2 |
| Organisation | Functions Manager |
| Migrations | `supabase/migrations/` (history recorded in `supabase_migrations.schema_migrations`, so `supabase db push` picks up from the latest) |

### Auth settings (Dashboard → Authentication)

These mirror `supabase/config.toml` and must be set by hand on the hosted project.

1. **URL configuration**
   - Site URL: the production URL (e.g. `https://runthefloor.app` or the Vercel URL).
   - Redirect URLs: `https://<prod>/auth/confirm`, `https://<prod>/auth/callback`, and the Vercel preview pattern `https://*-<team>.vercel.app/auth/*`.
2. **Sign-ups:** turn **off** "Allow new users to sign up". Access is invite-only; admins invite from the People screen.
3. **Email templates:** paste `supabase/templates/magic_link.html` into *Magic Link* and `supabase/templates/invite.html` into *Invite user*. They use `token_hash` links, so a link tapped in the Outlook app on a phone still signs in (the default PKCE link only works in the browser that requested it).
4. **SMTP:** the built-in email sender is heavily rate-limited and not for production. Add custom SMTP (Microsoft 365 or Resend) under *Emails → SMTP Settings* before the pilot.
5. **Sessions:** leave refresh tokens unlimited so devices stay signed in. Suspending someone revokes their sessions.

### Microsoft sign-in (optional)

1. Entra admin centre → App registrations → New registration (single tenant or multitenant as needed).
2. Redirect URI (Web): `https://pshvhvidywzstqwrjvdp.supabase.co/auth/v1/callback`.
3. Create a client secret. In Supabase → Authentication → Providers → Azure, add the client ID, secret and tenant URL.
4. Set `NEXT_PUBLIC_AUTH_MICROSOFT_ENABLED=true` in Vercel. An invited user who signs in with Microsoft using the same email is linked to their existing account.

### First admin

Provisioning is platform-only (SQL editor or service role):

```sql
-- once per venue
select app.provision_venue('org-slug', 'Org name', 'venue-slug', 'Venue name', 'Australia/Brisbane', 'AU-QLD', 'Licensee Pty Ltd');
-- after the person has an account (invite them from the dashboard, or they've signed in once)
select app.grant_membership('person@example.com', 'venue-slug', 'Admin');
```

`supabase/seed.sql` provisions a generic **Demo Hotel** (`/v/demo`) to try the app.

## Vercel

Environment variables (Production and Preview):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pshvhvidywzstqwrjvdp.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Settings → API Keys → publishable key |
| `SUPABASE_SECRET_KEY` | Supabase → Settings → API Keys → secret key (**server only**, used for invites) |
| `NEXT_PUBLIC_SITE_URL` | production URL (optional; falls back to the request host) |
| `NEXT_PUBLIC_AUTH_MICROSOFT_ENABLED` | `true` once the Azure provider is configured |
