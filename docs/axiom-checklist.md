# Axiom — Checklist Definitivo Pré-Deploy → Produção

> Estado atual: Commit `f9ec074` | 0 lint errors | Dev server funcional
> Gerado: 2026-02-23 | Baseado em auditoria de 38 itens

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

- [ ] **P1.1 Rewrite `usage.ts`** — Novos limites:
  - FREE: solve 3/dia, write 1/dia, humanize 500 words/dia, learn 2/dia
  - PRO ($19/mês): solve 50/dia (cap 1500/mês), write 20/dia (cap 600), humanize 5000 words/dia, learn 20/dia (cap 600)
  - ELITE ($49/mês): solve 150/dia (cap 4500), write 50/dia (cap 1500), humanize ilimitado, learn 50/dia (cap 1500)
  - Adicionar check mensal: `SUM(usage) WHERE date >= first_of_month`
  - Elite cap mensal: throttle 10 calls/hora (não bloqueia)
- [ ] **P1.2 Rewrite `lib/stripe/config.ts`** — 4 price IDs (Pro monthly/yearly + Elite monthly/yearly)
- [ ] **P1.3 Criar produtos no Stripe Dashboard** — Pro ($19/$190) + Elite ($49/$490)
- [ ] **P1.4 Atualizar `webhooks/stripe/route.ts`**:
  - Detectar price ID → setar 'pro' ou 'elite'
  - Tratar `customer.subscription.updated` (downgrade)
  - Cancelamento: respeitar `cancel_at_period_end`
- [ ] **P1.5 Redesign `paywall-modal.tsx`** — 3 tiers com toggle mensal/anual
- [ ] **P1.6 Watermark no Free** — Componente `<Watermark />` em solve/chat, write/editor, humanize/panel
- [ ] **P1.7 Anti-abuse**:
  - Conta nova = 24h antes de poder assinar
  - IP tracking: bloquear se mesmo IP cria 3+ contas free
  - Rate limit global: 10 calls/min qualquer tier (já em P0.2)

---

## P2 — SENTRY + ANALYTICS + CLEANUP

- [ ] **P2.1 Sentry** — `npx @sentry/wizard@latest -i nextjs`
- [ ] **P2.2 Vercel Analytics** — `@vercel/analytics` (1 linha)
- [ ] **P2.3 Remover Cypress** — Deletar `cypress/`, `cypress.config.ts`, deps do `package.json`
- [ ] **P2.4 LGPD/GDPR básico**:
  - Cookie consent banner
  - Botão "Delete my account" no Settings
  - Fix /privacy e /terms (adicionar ao `publicRoutes` no middleware)

---

## P3 — DEPLOY (Vercel)

- [ ] **P3.1 Push pro GitHub** — `git push origin main`
- [ ] **P3.2 Conectar repo no Vercel** — Import project
- [ ] **P3.3 Env vars no Vercel** — TODAS as variáveis do `.env.local` + `NEXT_PUBLIC_APP_URL` com domínio real
- [ ] **P3.4 Custom domain** — Conectar domínio comprado
- [ ] **P3.5 Supabase** — Atualizar redirect URLs (Google OAuth + email) pro domínio
- [ ] **P3.6 Stripe** — Configurar webhook endpoint prod: `https://dominio.com/api/webhooks/stripe`
- [ ] **P3.7 Google OAuth** — Atualizar redirect URI no Google Cloud Console
- [ ] **P3.8 Verificar build** — `pnpm build` deve passar sem erros

---

## P4 — TESTES PÓS-DEPLOY

- [ ] **P4.1 Auth flow** — Signup email → verificar email → login
- [ ] **P4.2 Google OAuth** — Login com Google funcional
- [ ] **P4.3 Stripe checkout** — Pagar Pro → webhook → plan atualiza
- [ ] **P4.4 Features IA** — Testar solve, write, humanize, panic com login real
- [ ] **P4.5 Rate limit** — Enviar 15 requests rápidos → verificar 429
- [ ] **P4.6 i18n** — Trocar idioma, verificar tradução
- [ ] **P4.7 Security headers** — `curl -I https://dominio.com` → verificar headers

---

## P5 — POLISH & UX

- [ ] **P5.1 Botão "Change Password"** no Settings
- [ ] **P5.2 Onboarding** — Modal pós-signup (3-4 slides)
- [ ] **P5.3 FAQ** — Página estática com accordion
- [ ] **P5.4 Help/Support** — Crisp widget ou email support
- [ ] **P5.5 Traduções landing** — Hero content em pt/es/fr/de/zh
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
