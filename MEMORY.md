# MEMORY.md — Decisões Arquiteturais

## 2026-03-16
- Phase 5C: Escolhemos Recursive CTE (não materialized path, não ltree)
  porque profundidade máxima = 4 níveis, dataset pequeno (centenas de orgs),
  zero overhead de sync. Reversível pra ltree se escalar.
- Propagação hierárquica nos server actions, não no RLS.
  Razão: mais simples e debugável pra solo dev.
  RISCO: acesso direto via Supabase SDK client bypassaria a lógica.
  REVISITAR quando dados reais de alunos menores estiverem no sistema.
