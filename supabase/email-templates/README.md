# Supabase auth email templates

Paste these into **Supabase Dashboard → Authentication → Email Templates**.

## Fix broken verification links (required for live site)

If signup emails link to `page-builder-cja.pages.dev`, Supabase **Site URL** is still set to the old Cloudflare Pages deploy.

1. Open [URL Configuration](https://supabase.com/dashboard/project/lwupkuhygzybnkoaoenr/auth/url-configuration)
2. Set **Site URL** to: `https://www.eateryvn.com`
3. Add **Redirect URLs** (one per line):
   ```
   https://www.eateryvn.com/api/auth/callback
   https://www.eateryvn.com/**
   https://eateryvn.com/api/auth/callback
   http://localhost:3000/api/auth/callback
   ```
4. **Remove** any URLs containing `page-builder-cja.pages.dev`
5. Save

After this, new signup emails will redirect to `https://www.eateryvn.com/api/auth/callback?code=...`.

Ensure Vercel has `NEXT_PUBLIC_APP_URL=https://www.eateryvn.com` and redeploy after merging auth fixes.

## Branded email templates

1. Go to [Email Templates](https://supabase.com/dashboard/project/lwupkuhygzybnkoaoenr/auth/templates)
2. **Confirm signup** → paste contents of `confirm-signup.html`
3. **Reset password** → paste contents of `reset-password.html`
4. Save each template

## Optional: custom SMTP (Resend)

Authentication → SMTP Settings → use Resend so emails send from `noreply@eateryvn.com`:

- Host: `smtp.resend.com`
- Port: `465` (SSL) or `587` (TLS)
- Username: `resend`
- Password: your Resend API key
- Sender: `noreply@eateryvn.com`
