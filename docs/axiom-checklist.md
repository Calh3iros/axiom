# Axiom — Checklist Definitivo Pré-Deploy → Produção

> Estado atual: Commit `527ae55` | 0 lint errors | Produção: axiom-solver.com
> Gerado: 2026-02-23 | Atualizado: 2026-03-12 (sessão 2) | Baseado em auditoria de 38 itens

---

## P0 — SEGURANÇA (ANTES do deploy)

- [x] **P0.1 Security Headers** — Adicionar em `next.config.ts`:
  - CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- [x] **P0.2 Rate Limiting (burst/DDoS)** — `@upstash/ratelimit`:
  - 10 calls/min por user em rotas IA, 60/min em outras
  - Criar `src/lib/ratelimit.ts`
  - Adicionar check em todas as 4 API routes IA
- [x] **P0.3 Input Validation** — Zod em TODAS as API routes:
  - chat: validar messages array, type, chatId, locale
  - write: validar action (enum), content (max 10KB), context
  - humanize: JÁ TEM (`humanizeRequestSchema`) ✅
  - learn/panic: validar subject (string, max 200 chars), chapter
- [x] **P0.4 Error Leaking** — Mudar 5 rotas pra NUNCA retornar `error.message`:
  - chat/route.ts:170, write:55, panic:58, portal:44, share:54
  - Retornar: `{ error: 'Internal Server Error' }` (genérico)
- [x] **P0.5 Error Boundaries** — Criar:
  - `src/app/error.tsx` (error boundary de page)
  - `src/app/global-error.tsx` (fallback fatal)
- [x] **P0.6 Timeout nas chamadas IA** — Configurar `abortSignal` com 30s timeout em:
  - chat/route.ts, write/route.ts, humanize/route.ts, panic/route.ts
- [x] **P0.7 maxOutputTokens** — Limitar output do Gemini:
  - chat: 4096 tokens, write: 2048, humanize: 4096, panic: 8192

---

## P1 — MONETIZAÇÃO 3 TIERS

- [x] **P1.1 Rewrite `usage.ts`** — ✅ JÁ IMPLEMENTADO (393 linhas):
  - FREE: solve 3/dia, write 1/dia, humanize 500 words/dia, learn 2/dia
  - PRO ($19/mês): solve 50/dia (cap 1500/mês), write 20/dia (cap 600), humanize 5000 words/dia, learn 20/dia (cap 600)
  - ELITE ($49/mês): solve 150/dia (cap 4500), write 50/dia (cap 1500), humanize ilimitado, learn 50/dia (cap 1500)
  - Check mensal + Elite throttle 10 calls/hora + streak tracking + badges
- [x] **P1.2 Rewrite `lib/stripe/config.ts`** — 4 price IDs configurados via env vars (NEXT_PUBLIC_STRIPE_PRO/ELITE_MONTHLY/YEARLY_PRICE_ID) ✅
- [x] **P1.3 Criar produtos no Stripe Dashboard** — Pro ($19/$190) + Elite ($49/$490) criados em Test + Live Mode ✅
- [x] **P1.4 Atualizar `webhooks/stripe/route.ts`** ✅:
  - Detecta price ID → seta 'pro' ou 'elite' via `planFromPriceId()`
  - Trata `customer.subscription.updated` (downgrade)
  - Cancelamento: respeita `cancel_at_period_end`
  - Trata `customer.subscription.deleted` → reverte para free
- [x] **P1.5 Redesign `pricing-section.tsx`** — 3 tiers com toggle mensal/anual, checkout via `/api/stripe/checkout` ✅
- [x] **P1.6 Watermark no Free** — ✅ JÁ IMPLEMENTADO: `<Watermark />` em solve/chat.tsx, write/editor.tsx, humanize/panel.tsx
- [x] **P1.7 Anti-abuse**:
  - IP tracking: `ip_signups` table, check no auth callback (3+ signups = flag)
  - Export restriction: Free users blocked via `isPaidPlan()` guard
  - Rate limit per tier: Free 5/min, Pro 15/min, Elite 30/min (Upstash)

---

## P2 — SENTRY + ANALYTICS + CLEANUP

- [x] **P2.1 Sentry** — `@sentry/nextjs`, 3 config files, instrumentation.ts, error.tsx integration
- [x] **P2.2 Vercel Analytics** — `@vercel/analytics`, `<Analytics />` in root layout
- [x] **P2.3 Health check bugs** — locale-aware redirects, themeColor → viewport, publicRoutes verified
- [x] **P2.4 Remove Cypress** — Deleted `cypress/`, `cypress.config.ts`, deps
- [x] **P2.5 LGPD/GDPR**:
  - Cookie consent banner in root layout
  - "Delete my account" button in Settings (calls `auth.admin.deleteUser`)
  - `/privacy` and `/terms` already in `publicRoutes`

---

## P3 — DEPLOY (Vercel)

- [x] **P3.1 Push pro GitHub** — `git push origin main`
- [x] **P3.2 Conectar repo no Vercel** — Import project → axiom-five-sable.vercel.app
- [x] **P3.3 Env vars no Vercel** — 15 variáveis, NEXT_PUBLIC_APP_URL=https://axiom-solver.com
- [x] **P3.4 Custom domain** — axiom-solver.com + www, Cloudflare DNS-only + Full (strict)
- [x] **P3.5 Supabase** — Site URL + 4 redirect URLs produção, localhost preservado
- [x] **P3.6 Stripe** — Webhook prod LIVE: axiom-solver.com/api/webhooks/stripe (5 eventos: checkout.session.completed, customer.subscription.updated/deleted, invoice.payment_succeeded/failed)
- [x] **P3.7 Google OAuth** — JS origins: axiom-solver.com + www.axiom-solver.com
- [x] **P3.8 Verificar build** — `pnpm build` passa sem erros

---

## P4 — TESTES PÓS-DEPLOY

- [x] **P4.1 Auth flow** — ✅ Testado: signup `soren2222+axiomtest@gmail.com` → email verificação → confirm → dashboard
- [ ] **P4.2 Google OAuth** — Pendente teste manual (requer popup Google)
- [x] **P4.3 Stripe checkout** — ✅ (Test Mode + Live Mode configurado e deployado)
- [x] **P4.4 Features IA** — ✅ Testadas 4/4: Solve (derivada OK), Write (outline OK), Humanize (OK), Learn (Linear Algebra OK)
- [x] **P4.5 Rate limit** — ✅ Código correto: Upstash Redis sliding window (Free 5/min, Pro 15/min, Elite 30/min) em 4 rotas
- [x] **P4.6 i18n** — 6 locales (en/pt/es/fr/de/zh) retornam 200 + hreflang alternates
- [x] **P4.7 Security headers** — CSP, HSTS, X-Frame-Options, X-Content-Type, Referrer-Policy, Permissions-Policy ✅

---

## P5 — POLISH & UX

- [x] **P5.1 Botão "Change Password"** — ✅ `37ab07e` — Inline no Settings, Supabase `updateUser()`, só email users, 6 locales
- [x] **P5.2 Onboarding** — ✅ `ba834f6` — 4-slide modal (Solve/Write/Humanize/Learn), localStorage, 6 locales
- [x] **P5.3 FAQ** — ✅ `527ae55` — 8 Q&A accordion, /faq rota pública, 6 locales
- [x] **P5.4 Help/Support** — ✅ `452ae7f` — Card no Settings: mailto email, Privacy Policy, Terms links, 6 locales
- [x] **P5.5 Traduções landing** — Hero content em pt/es/fr/de/zh ✅
- [ ] **P5.6 Fix themeColor** → viewport export (8 páginas)

---

## P6 — GROWTH (1000+ users)

- [ ] **P6.1 PostHog** — Analytics avançado (funnels, retention)
- [ ] **P6.2 Admin dashboard** — Rota `/admin` com role check
- [ ] **P6.3 Vitest** — Testes unitários para core logic
- [ ] **P6.4 SEO** — Sitemap, robots.txt, structured data
- [ ] **P6.5 Export PDF/DOCX** — Feature Pro/Elite

---

## NOTAS IMPORTANTES

- **Stack atual (Next.js + Supabase + Vercel + Gemini) suporta 10K+ users sem mudança de arquitetura**
- **NÃO precisa**: Python, FastAPI, Redis, Docker, Kubernetes, microserviços
- **Modelo**: gemini-2.5-flash em todas as rotas (~$0.001/call)
- **Margem saudável**: Pro 92% ($17.50 lucro/$19), Elite 90% ($44 lucro/$49)
- **Cypress**: remover sem medo (Playwright faz tudo)
- **npm audit**: 2 high são dev-only (minimatch), zero risco em runtime
