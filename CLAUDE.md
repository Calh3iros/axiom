# Axiom — Contexto para Sessões Claude Code

> Atualizado: 2026-03-12 | Branch: `main` | Deploy: Vercel (axiom-solver.com)

---

## O QUE É O AXIOM

Plataforma educacional com IA (Gemini 2.5 Flash) para estudantes universitários.
5 módulos: Solve (chat IA), Write (editor redações), Humanize (reescrita anti-detector), Learn (estudo guiado), Map (mapa de conhecimento).

**Stack:** Next.js 16 + Supabase (auth/db) + Stripe (billing 3 tiers) + Gemini AI SDK + next-intl (6 locales: en/pt/es/fr/de/zh) + Tailwind + shadcn/ui + Vercel (hosting)

**Domínio:** axiom-solver.com (Cloudflare DNS → Vercel)

---

## MONETIZAÇÃO (3 TIERS)

| Tier  | Preço               | Stripe Product        |
| ----- | ------------------- | --------------------- |
| FREE  | $0                  | —                     |
| PRO   | $19/mês ou $190/ano | Configurado no Stripe |
| ELITE | $49/mês ou $490/ano | Configurado no Stripe |

---

## ESTADO ATUAL (12/03/2026)

### Completo (em produção)

- P0: Segurança (headers, rate limit, input validation, error boundaries, timeouts, maxOutputTokens)
- P1.2-P1.7: Stripe 3-tier, paywall modal, watermark free, anti-abuse
- P2: Sentry, Vercel Analytics, bug fixes, LGPD/GDPR (cookie consent + delete account)
- P3: Deploy completo (Vercel + domínio + Supabase + Stripe webhook + Google OAuth)
- P4.3: ✅ Stripe checkout end-to-end TESTADO E FUNCIONANDO (Test + Live Mode)
- P4.6: i18n landing page (6 locales traduzidos)
- P4.7: Security headers verificados
- P5.5: Traduções da landing page completas
- Landing page com botões Login/Start Now no navbar
- Footer com email mysupport@axiom-solver.com
- Stripe Live Mode ATIVO — cobranças reais habilitadas
- Pricing page movida para dentro de `(app)` route group

### Pendente

- P1.1: Rewrite `usage.ts` com limites granulares por tier (diário + mensal)
- P4.1: Teste auth flow (signup email → verificar → login)
- P4.2: Teste Google OAuth em produção
- P4.4: Teste features IA com login real
- P4.5: Teste rate limit (429)
- P5.1: Botão "Change Password" no Settings
- P5.2: Onboarding modal pós-signup
- P5.3: FAQ page
- P5.4: Help/Support (Crisp widget ou email)
- P5.6: Fix themeColor → viewport export (8 páginas)
- P6: Growth (PostHog, admin dashboard, Vitest, SEO, export PDF/DOCX)

---

## ESTRUTURA DE PASTAS IMPORTANTE

```
src/
├── app/[locale]/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout (Analytics, Sentry, CookieConsent)
│   ├── (app)/                # App autenticado (solve, write, humanize, learn, map, settings, panic)
│   ├── (share)/share/[id]/   # Compartilhamento público de chats
│   ├── auth/                 # Login, signup, forgot-password, update-password
│   ├── privacy/              # Política de privacidade
│   └── terms/                # Termos de serviço
├── api/
│   ├── chat/route.ts         # Solve AI
│   ├── write/route.ts        # Write AI
│   ├── humanize/route.ts     # Humanize AI
│   ├── panic/route.ts        # Learn/Panic AI
│   ├── checkout/route.ts     # Stripe checkout session
│   ├── portal/route.ts       # Stripe customer portal
│   ├── webhooks/stripe/      # Stripe webhook handler
│   └── share/route.ts        # Chat sharing
├── components/
│   ├── layout/app-shell.tsx  # Sidebar + layout principal
│   ├── shared/               # cookie-consent, paywall-modal, watermark, language-switcher
│   ├── solve/, write/, humanize/, learn/  # Componentes por módulo
├── lib/
│   ├── supabase/             # Client + server + middleware helpers
│   ├── stripe/               # Config + helpers
│   ├── ratelimit.ts          # Upstash rate limiting
│   └── usage.ts              # Usage tracking + limits
├── messages/                 # i18n JSON (en, pt, es, fr, de, zh)
docs/
├── axiom-status-master.md    # Auditoria original (22/02/2026)
├── axiom-checklist.md        # Checklist P0-P6
├── privacy-policy.md, terms-of-service.md, refund-cancellation-policy.md
```

---

## INTEGRAÇÕES & ENV VARS

| Serviço       | Status       | Vars                                                                                                                                                                                                          |
| ------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase      | Ativo        | NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY                                                                                                                            |
| Stripe        | Ativo (LIVE) | NEXT*PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_live*), STRIPE*SECRET_KEY (sk_live*), STRIPE*WEBHOOK_SECRET (whsec*), NEXT_PUBLIC_STRIPE_PRO_MONTHLY/YEARLY_PRICE_ID, NEXT_PUBLIC_STRIPE_ELITE_MONTHLY/YEARLY_PRICE_ID |
| Gemini AI     | Ativo        | GEMINI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY                                                                                                                                                                  |
| Sentry        | Ativo        | SENTRY_DSN, SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT                                                                                                                                                     |
| Upstash Redis | Ativo        | UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN                                                                                                                                                              |
| Vercel        | Ativo        | Deploy automático via GitHub push                                                                                                                                                                             |
| Cloudflare    | DNS only     | axiom-solver.com → Vercel                                                                                                                                                                                     |

---

## CONVENÇÕES DO USUÁRIO

- **SC** = "Só Conversando" — significa que o usuário quer apenas conversar, sem edições de código
- **Deploy** = git push origin main → Vercel faz deploy automático
- **Idioma** = Português brasileiro (comunicação com o usuário)
- O banco Upstash Redis precisa de ping periódico para não ser arquivado por inatividade

---

## SESSÃO 11/03/2026 — O QUE FOI FEITO

1. Ping no Redis Upstash (PONG confirmado — banco ativo)
2. Footer da landing page: trocado link "Contact" por `mysupport@axiom-solver.com`
3. Removido sufixo "SC" do footer (era instrução de conversa, não conteúdo)
4. Tudo commitado e deployado em produção via Vercel

---

## SESSÃO 12/03/2026 — O QUE FOI FEITO

### Bugs corrigidos

1. **Pricing page 404**: Movido `src/app/[locale]/pricing/page.tsx` → `src/app/[locale]/(app)/pricing/page.tsx` (commit anterior via Claude Code)
2. **Vercel build failures**: Atualizado `pnpm-lock.yaml` e Stripe `apiVersion` de `2024-12-18.acacia` → `2026-02-25.clover` (commits anteriores)
3. **Checkout "Processing..." sem redirect**: `PRICE_IDS` em `lib/stripe.ts` lia env vars erradas (`STRIPE_PRICE_PRO_MONTHLY` não existia). Fix: apontou para `NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID` — commit `2a13a7f`
4. **Webhook "Invalid API key"**: `SUPABASE_SERVICE_ROLE_KEY` no Vercel estava inválida. Atualizada com a key correta do Supabase Dashboard

### Stripe Test Mode → Live Mode (migração completa)

5. **Produtos Live criados**: Axiom Pro ($19/mo `price_1TA9pJJUCZAbl4oXzC5YgLTc`, $190/yr `price_1TA9pJJUCZAbl4oXE5tmawoK`) e Axiom Elite ($49/mo `price_1TA9rmJUCZAbl4oXIUHBj6BH`, $490/yr `price_1TA9rmJUCZAbl4oXo9q3ht55`)
6. **Webhook Live criado**: `https://axiom-solver.com/api/webhooks/stripe` com 5 eventos, signing secret `whsec_OcgUaXoijsOT84EiNMHtLOiX7GGrjxeZ`
7. **Customer Portal Live**: Cancel, Update payment, Invoice history — habilitados
8. **API Keys Live**: `pk_live_51T3LgJJUCZAbl4oX...` e `sk_live_51T3LgJJUCZAbl4oX...`
9. **Vercel env vars atualizadas (7)**: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET, 4x Price IDs
10. **Redeploy** com novas env vars — status Ready

### Commits desta sessão

- `2a13a7f` — fix(stripe): use correct env var names for PRICE_IDS

### Alterações no Dashboard (sem commit)

- Vercel: `SUPABASE_SERVICE_ROLE_KEY` corrigida + 7 Stripe env vars atualizadas para Live
- Stripe Live: 2 produtos + 4 prices + 1 webhook + Customer Portal
- Stripe Test: webhook endpoint "elegant-rhythm" já existia e funcionava (200 OK)
