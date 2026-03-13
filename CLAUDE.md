# Axiom — Contexto para Sessões Claude Code

> Atualizado: 2026-03-13 | Branch: `main` | Deploy: Vercel (axiom-solver.com)

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

## ESTADO ATUAL (13/03/2026)

### Completo (em produção)

- P0: Segurança (headers, rate limit, input validation, error boundaries, timeouts, maxOutputTokens)
- P1.1: ✅ `usage/limits.ts` com limites granulares por tier (free/pro/elite) + 22 testes
- P1.2-P1.7: Stripe 3-tier, paywall modal, watermark free, anti-abuse
- P2: Sentry, Vercel Analytics, bug fixes, LGPD/GDPR (cookie consent + delete account)
- P3: Deploy completo (Vercel + domínio + Supabase + Stripe webhook + Google OAuth)
- P4.1: ✅ Auth flow email testado end-to-end (signup → email Resend → verificação → login)
- P4.3: ✅ Stripe checkout end-to-end TESTADO E FUNCIONANDO (Test + Live Mode)
- P4.6: i18n landing page (6 locales traduzidos)
- P4.7: Security headers verificados
- P5.1: ✅ Change Password no Settings (form com validação)
- P5.2: ✅ Onboarding modal pós-signup (4 slides, localStorage)
- P5.3: ✅ FAQ page (accordion i18n completo)
- P5.4: ✅ Help/Support (seção no Settings com email + links)
- P5.5: Traduções da landing page completas
- P5.6: ✅ Fix themeColor → `export const viewport: Viewport` no layout.tsx
- P6 parcial: ✅ PostHog (provider + pageview tracking no layout)
- P6 parcial: ✅ Export PDF/DOCX (`export-utils.ts` usado em Solve + Write)
- P6 parcial: ✅ Vitest (22/22 testes passando)
- Landing page V2 deep orange com botões Login/Start Now
- Footer com email support@axiom-solver.com + FAQ link
- Stripe Live Mode ATIVO — cobranças reais habilitadas
- Resend SMTP verificado — emails de confirmação funcionando

### Pendente

- P4.2: Teste Google OAuth em produção
- P4.5: Teste rate limit (429)
- P6: Admin dashboard, SEO avançado

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
- **SG** = "Segurança / Guardrails" — workflow: TESTAR → RETER (verificar, documentar, commitar)
- **Deploy** = git push origin main → Vercel faz deploy automático
- **Idioma** = Português brasileiro (comunicação com o usuário)
- O banco Upstash Redis precisa de ping periódico para não ser arquivado por inatividade

---

## 7 PRINCÍPIOS SG (GUARDRAILS PARA AGENTE IA)

1. **Menor Privilégio (Least Privilege)** — O agente só toca nos arquivos explicitamente autorizados. Default-deny: tudo que não foi pedido é proibido.
2. **Contenção de Escopo (Scope Containment)** — Toda ação se limita ao escopo da tarefa. "SG > item X" = apenas X, sem scope creep.
3. **Anti-Alucinação (Grounding)** — Toda ação baseada em evidência, não suposição. Verificar antes de agir, ler antes de editar. Se não sabe, perguntar.
4. **Aprovação Humana (Human-in-the-Loop)** — Ações de alto risco exigem OK do humano antes de executar (delete, push, env vars).
5. **Auditabilidade (Audit Trail)** — Toda ação registrada e rastreável. CLAUDE.md como log de sessões, commits descritivos.
6. **Defesa em Camadas (Layered Defense)** — INPUT (task definida) → SCOPE (arquivos permitidos) → ACTION (aprovação) → OUTPUT (testar) → RETAIN (documentar).
7. **Reversibilidade (Reversibility)** — Toda mudança deve ser reversível. Git commit antes de mudanças grandes, edições cirúrgicas > reescritas.

> Referências: NIST AI RMF (AI 600-1), OWASP LLM Top 10, Stanford AI Safety, Principle of Least Privilege (PoLP)

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

---

## SESSÃO 13/03/2026 — O QUE FOI FEITO

### Links FAQ adicionados

1. **FAQ link no footer da landing page**: Adicionado entre "Terms" e o email de contato
2. **FAQ link na sidebar do app**: Adicionado com ícone `HelpCircle`, abaixo de Settings
3. **i18n completo**: Chaves `footer.faq` e `sidebar.faq` adicionadas nos 6 locales (en/pt/es/fr/de/zh)
4. **Verificado no browser**: Footer mostra link "FAQ" e clique redireciona para `/faq` corretamente

### Commits desta sessão

- `dbdd330` — feat: add FAQ links to landing footer and app sidebar (6 locales)

### Fix: Get Pro / Get Elite para usuários não logados

5. **Pricing buttons fix**: Botões "Get Pro →" e "Get Elite →" na landing page falhavam silenciosamente para visitantes não autenticados (401 sem feedback). Fix: `pricing-section.tsx` agora verifica auth via Supabase antes de chamar checkout API. Se não logado, redireciona para `/auth/signup?plan=pro&interval=monthly` preservando contexto do plano escolhido.
6. **401 fallback**: Se sessão expirar mid-page, o handler agora redireciona para `/auth/login` com plan context.
7. **Testado no browser**: Get Pro (monthly ✅), Get Elite (monthly ✅), Get Pro (yearly ✅) — todos redirecionam para signup com params corretos.

### Commits adicionais

- `a722204` — fix: redirect unauthenticated users to signup when clicking Get Pro/Elite

### Landing Page V2 — Deep Orange + i18n + Student Images

8. **V2 Landing Page rewrite**: Complete landing page adapted from user's HTML template with deep orange color scheme, demo window, ticker, testimonials, pricing toggle
9. **Countdown timer**: Text "Time Left:" with 23h daily cycle, quadrupled size
10. **Ticker section**: Quadrupled size — label, items, trust numbers, avatars
11. **Student hero images**: 3 AI-generated images of stressed students between pain text and solution text
12. **CTA updates**: "Start Now →", removed "No signup" from bottom note

### Deep Orange Theme — Full App Conversion

13. **Phase 1 — Emerald → Orange**: `emerald-*` → `orange-*` in 11 components (pricing-section, paywall-modal, onboarding-modal, cookie-consent, app-shell, chat, signup, forgot-password, map, pricing, settings)
14. **Phase 2 — Blue → Orange**: Changed CSS var `--color-ax-blue: #60a5fa` → `#f97316` in globals.css. Batch-replaced `blue-*` → `orange-*` Tailwind classes in 14 more files (all auth pages, dashboard, solve, chat, editor, humanize, faq, share)
15. **Middleware fix**: Updated matcher to exclude `.png`, `.jpg`, `.webp`, `.svg`, `.gif` from auth checks — static images were being redirected to login

### i18n Landing Page — 6 Locales

16. **en.json**: Full V2 landing strings added (nav, hero, ticker, features, testimonials, upsell, compare, pricing, cta, footer)
17. **pt/es/fr/de/zh.json**: All translated with locale-specific content
18. **page.tsx**: Wired to `useTranslations('Landing')` — 100+ hardcoded strings replaced with `t()` calls
19. **Language switcher**: Works on landing page — verified EN ↔ PT switching

### Resend SMTP for Supabase

20. **Resend account**: Created via GitHub OAuth (Calh3iros), domain axiom-solver.com (São Paulo region)
21. **DNS records**: 4 records added to Cloudflare via API (DKIM TXT, MX send, SPF TXT, DMARC TXT)
22. **Supabase SMTP**: Configured `noreply@axiom-solver.com` via `smtp.resend.com:465`, username `resend`, password = Resend API key
23. **Resend API key**: `re_6Yzh5gXu_7kwHRp8cfYxzbmYnDmfQCM3r` (also used as SMTP password)
24. **Cloudflare Zone ID**: `822002c5011f4f7c4be341be71e00bc3`

### Commits (afternoon)

- `56ec460` — feat: deep orange theme, i18n landing (6 locales), student hero images, middleware fix (27 files, +1653/-764)
- `6951057` — fix: convert all blue accents to deep orange auth, dashboard, chat, editor (14 files, +17/-17)

### Vitest: 22/22 tests pass ✅

### SG > TESTAR > RETER — 3 Itens Urgentes (tarde)

25. **Resend domain VERIFICADO** ✅: axiom-solver.com verificado em 13/03 12:03 PM. DKIM (Verified), SPF MX (Verified), SPF TXT (Verified). Sending habilitado, região São Paulo (sa-east-1)
26. **Deep orange em produção VERIFICADO** ✅: Landing page inteira em deep orange — navbar, hero, imagens estudantes, ticker, features, testimonials, compare, pricing, CTA, footer. Nenhum elemento azul funcional encontrado. Glows de background sutis permanecem (cosmético, não bloqueante)
27. **Cloudflare API token**: Descartado — dev solo, sem risco real
28. **Email signup end-to-end VERIFICADO** ✅: Signup em produção → email de confirmação chegou via Resend SMTP → conta criada em free mode. Login sem verificação corretamente bloqueado com "Email not confirmed"
29. **P4.4 Features IA VERIFICADAS** ✅: Solve (derivada correta + step-by-step), Write (expansão de parágrafo + export .docx), Humanize (reescrita + human score), Learn/Panic (tutor com analogias). Todos os 4 módulos funcionando com conta ELITE em produção

### Commits (noite)

- `a83f63b` — docs: SG verify Resend domain + deep orange production
- `25cbd00` — docs: SG verify email signup e2e
- `78d5b79` — docs: update CLAUDE.md - move 8 completed items from pending to done

---

## PENDENTE (próxima sessão)

- P4.2: Teste Google OAuth em produção
- P4.5: Teste rate limit (429)
- P6: Admin dashboard, SEO avançado
