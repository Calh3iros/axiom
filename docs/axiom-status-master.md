# Axiom — Status Master (22/02/2026)

> Auditado: 22/02/2026 22:30 BRT | Commit: `e8de70d` (main) | Next.js 16.1.6
> Stack: Next.js 16 + Supabase + Stripe + Gemini AI SDK + next-intl (6 locales) + Tailwind + shadcn/ui

---

## ESTADO GERAL

**App funcional em localhost, zero produção.** Arquitetura correta (Auth, Billing, AI, i18n), todas as UIs renderizam, todas as API routes existem e respondem. Nenhuma feature foi testada end-to-end com login real. 7 bugs encontrados, 245 erros de lint.

---

## BUGS (7)

| # | Bug | Severidade | Arquivo | Fix |
|---|-----|-----------|---------|-----|
| 1 | `/privacy` e `/terms` redirecionam pro login | 🔴 Médio | `middleware.ts:7` | Adicionar nos `publicRoutes` |
| 2 | Redirect perde locale (`/pt/solve` → `/en/auth/login`) | 🟡 Baixo | `middleware.ts:61` | Usar locale dinâmico no redirect |
| 3 | `NEXT_PUBLIC_APP_URL=localhost:5000` (porta errada) | 🟡 Baixo | `.env.local:19` | Mudar pra `localhost:3000` |
| 4 | `icon-192.png` missing (404 console) | 🟡 Baixo | `public/` | Criar ou referenciar icon existente |
| 5 | Landing hero não traduzido (inglês em todos locales) | 🔴 Médio | `[locale]/page.tsx` | Substituir hardcoded por `t()` calls |
| 6 | `themeColor` no metadata em vez de viewport (x8 páginas) | 🟡 Baixo | 8 page files | Mover pra export `viewport` |
| 7 | `loadChats` acessado antes da declaração | 🔴 Médio | `solve/page.tsx:19-22` | Reordenar declaração |

---

## FEATURES (19)

| # | Feature | Status | Notas |
|---|---------|--------|-------|
| 1 | Landing Page | ✅ Funciona | Hero, features, pricing, footer |
| 2 | Auth - Email/Password | ⚠️ UI ok, flow untested | Precisa Supabase email provider ativo |
| 3 | Auth - Google OAuth | ⚠️ UI ok, flow untested | Precisa Google project credentials |
| 4 | Auth - Middleware | ✅ Funciona | 🔴 Falta `/privacy`, `/terms` |
| 5 | Solve (AI Chat) | ⚠️ UI + API existem | Untested com login |
| 6 | Write (Essay Editor) | ⚠️ UI + API existem | Untested com login |
| 7 | Humanize (AI Text) | ⚠️ UI + API existem | Untested com login |
| 8 | Learn (Panic Mode) | ⚠️ UI + API existem | Untested com login |
| 9 | Knowledge Map | ⚠️ UI existe | Server component, untested |
| 10 | Settings | ⚠️ UI existe | Untested |
| 11 | Stripe Checkout | ⚠️ API + UI existem | Precisa Stripe test mode |
| 12 | Stripe Portal | ⚠️ API existe | Untested |
| 13 | Stripe Webhooks | ⚠️ API existe | Precisa webhook forwarding |
| 14 | Chat Sharing | ⚠️ Route existe | Untested |
| 15 | Usage Limits | ⚠️ Código existe | Untested |
| 16 | i18n (6 locales) | ⚠️ Parcial | Switcher funciona, hero hardcoded EN |
| 17 | App Shell (Sidebar) | ⚠️ Código existe | Precisa auth pra ver |
| 18 | Privacy / Terms | 🔴 Bloqueado | Bug #1 middleware |
| 19 | PWA Manifest | ⚠️ Parcial | icon-192.png missing |

**Resumo: 19 features, 0 testadas end-to-end, 2 bloqueadas por bugs, 15 precisam de login.**

---

## INTEGRAÇÕES

| Serviço | Config | Status |
|---------|--------|--------|
| Supabase Auth | ✅ URL + ANON + SERVICE_ROLE | ⚠️ Untested live |
| Stripe | ✅ pk_test + sk_test + whsec + price IDs | ⚠️ Untested live |
| Gemini AI | ✅ GEMINI_API_KEY + GOOGLE_GENERATIVE_AI_API_KEY | ⚠️ Untested live |
| Anthropic | ❌ ANTHROPIC_API_KEY vazio | Não configurado |
| i18n | ✅ 6 locales (en, pt, es, fr, de, zh) | ⚠️ Parcial |

---

## LINT (245 problemas)

| Count | Rule | Fix |
|-------|------|-----|
| 128 | `import/order` | `pnpm lint --fix` (126 auto) |
| 49 | `no-explicit-any` | Tipagem manual (~20 arquivos) |
| 34 | `no-console` | Ignorar `scripts/` no config |
| 23 | `no-unused-vars` | Remoção direta |
| 5 | `no-img-element` | `next/image` ou ignorar |
| 3 | `no-unescaped-entities` | `&apos;` |
| 2 | hooks | Caso a caso |
| 1 | anonymous default export | Named export |

---

## INFRA PENDENTE

- [ ] Deploy em Vercel (ou outro hosting)
- [ ] Env vars em produção
- [ ] `NEXT_PUBLIC_APP_URL` corrigido pra URL de produção
- [ ] Domínio custom (se tiver)
- [ ] Stripe webhook endpoint apontando pra produção
- [ ] Supabase redirect URLs configuradas pra produção
- [ ] Google OAuth redirect URIs pra produção

---

## PRIORIDADES (ordem de execução)

### P0 — Bugs bloqueadores (10 min)
1. Fix middleware: adicionar `/privacy`, `/terms` nos `publicRoutes`
2. Fix middleware: locale dinâmico no redirect (não hardcoded `/en`)
3. Fix `loadChats` variable-before-declaration
4. Fix `.env.local` porta 5000 → 3000

### P1 — Testes end-to-end com login real (30 min)
5. Login via Supabase (email ou Google OAuth)
6. Testar CADA feature logado (Solve, Write, Humanize, Learn, Map, Settings)
7. Testar Stripe checkout flow (test mode)
8. Testar chat sharing

### P2 — Lint cleanup (20 min)
9. `pnpm lint --fix` (mata 126 import/order)
10. Adicionar ignores no config pra scripts/
11. Remover unused vars/imports
12. Tipar os `any` mais críticos (API routes, webhooks)

### P3 — Deploy (30-60 min)
13. Vercel setup + env vars
14. Stripe webhook URL de produção
15. Supabase + Google OAuth redirect URLs
16. DNS se tiver domínio custom

### P4 — Polish
17. i18n hero translation
18. `next/image` nos 5 lugares
19. `themeColor` → viewport export
20. PWA icon
21. Os 49 `any` restantes

---

## DEPRECATION WARNINGS

```
⚠ "middleware" file convention deprecated → use "proxy" (Next 16)
⚠ themeColor in metadata → move to viewport export (x8 pages)
```

Não quebram nada agora, mas precisam ser resolvidos antes de atualizar Next.js.
